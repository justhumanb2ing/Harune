---
title: Profile image and bento media external API migration contract
date: 2026-05-08
category: best-practices
module: profile-page
problem_type: best_practice
component: api
severity: medium
applies_when:
  - `/profile/image`와 `/profile/bento/media/upload`를 외부 API 서버로 옮길 때
  - profile image upload, finalize, delete 흐름을 분리된 계약으로 유지해야 할 때
  - bento media upload를 draft sync 이전 단계의 temporary object upload로 다뤄야 할 때
tags: [profile-page, image-upload, bento, media-upload, external-api, migration]
---

# Profile image and bento media external API migration contract

## Context

현재 profile image와 bento media 업로드는 같은 profile API 영역에 있지만, 책임은 분리되어 있다.
`/profile/image`는 profile page의 고정 이미지 슬롯을 위한 3단계 계약이고, `/profile/bento/media/upload`는 bento media의 temporary upload 계약이다.

외부 API 서버로 옮길 때는 이 책임 분리를 유지해야 한다.
단순히 파일 업로드만 옮기는 것이 아니라, upload, finalize, delete, ownership check, committed read semantics를 각각 보존해야 한다.

## Current Route Responsibilities

### `POST /profile/image`

역할:

- profile image 또는 background image 파일을 서버에 업로드한다.
- `FormData`의 `file`, `imageHash`, `imageKind`를 검증한다.
- 파일 타입과 용량 제한을 검사한다.
- SHA-256 hash가 업로드된 bytes와 일치하는지 확인한다.
- 사용자별 고정 object key에 R2 object를 저장한다.
- 업로드 직후 public URL을 반환한다.

Request body:

```ts
// multipart/form-data
{
  file: File;
  imageKind: "profile" | "background";
  imageHash: string; // 64-char SHA-256 hex
}
```

Success response:

```ts
{
  imageKind: "profile" | "background";
  imageUrl: string;
  objectKey: string;
  contentType: string;
  contentLength: number;
}
```

이 엔드포인트는 storage write만 담당하고 DB finalize는 하지 않는다.
성공 응답은 `Cache-Control: no-store`와 `Pragma: no-cache`를 반환한다.

Failure response:

```ts
{
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### `PATCH /profile/image`

역할:

- 업로드된 profile image URL을 profile page DB에 finalize한다.
- `imageKind`와 `imageUrl`을 검증한다.
- URL이 authenticated user의 expected slot object key와 일치하는지 확인한다.
- `profile_page.image` 또는 `profile_page.backgroundImage`를 갱신한다.
- 최종적으로 committed DB snapshot 기준의 결과를 반환한다.

Request body:

```ts
{
  imageKind: "profile" | "background";
  imageUrl: string;
}
```

Success response:

```ts
{
  imageKind: "profile" | "background";
  imageUrl: string;
  image: string | null;
  backgroundImage: string | null;
  updatedAt: string;
}
```

`PATCH` 성공 응답은 committed-read 기준이어야 한다.
즉, `imageUrl` echo만 반환하지 말고 DB에 실제로 반영된 최신 persisted row를 돌려줘야 한다.

Failure response:

```ts
{
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### `DELETE /profile/image`

역할:

- 더 이상 사용하지 않는 profile image object를 storage에서 삭제한다.
- `imageUrl`을 검증하고, 그 URL이 authenticated user 소유 슬롯의 object인지 확인한다.
- profile/background replacement 또는 rollback 상황에서 orphan object를 제거한다.

Request body:

```ts
{
  imageUrl: string;
}
```

Success response:

```ts
{
  success: true;
  deletedObjectKey: string;
}
```

삭제는 object 삭제가 핵심이고, 현재 슬롯을 비우는 DB finalize는 별도 계약으로 둔다.
즉, delete는 storage cleanup만 수행하고 row mutation은 하지 않는다.

Failure response:

```ts
{
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### `POST /profile/bento/media/upload`

역할:

- bento media를 temporary object key로 업로드한다.
- `bentoId`와 `file`을 검증한다.
- 이미지/비디오 타입과 5MB 제한을 검사한다.
- SHA-256 hash를 계산한다.
- temporary object key에 저장하고 `tempObjectKey`, `tempUrl`, `contentHash`, `contentType`, `mediaType`를 반환한다.

Request body:

```ts
// multipart/form-data
{
  bentoId: string;
  file: File;
}
```

Success response:

```ts
{
  bentoId: string;
  contentHash: string;
  contentType: string;
  mediaType: "image" | "video";
  tempObjectKey: string;
  tempUrl: string;
}
```

이 엔드포인트는 temp-only 계약이다.
final object key copy, final DB row 생성, committed read finalize는 하지 않는다.

Failure response:

```ts
{
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

## Why The Split Exists

profile image와 bento media는 비슷해 보여도 저장 모델이 다르다.

- profile image는 고정 슬롯이다.
  - 사용자당 `profile`과 `background` 두 개의 stable object key만 사용한다.
  - upload 후 즉시 finalize해서 `profile_page.image` 또는 `profile_page.backgroundImage`를 기록해야 한다.
- bento media는 draft 기반이다.
  - 먼저 temporary object를 올리고,
  - sync 시점에 final object key로 copy한 뒤,
  - committed read로 bento row를 완성해야 한다.

이 차이를 무시하면 다음 문제가 생긴다.

- profile image가 저장소에는 있는데 DB에는 남지 않는 문제
- 같은 image를 다시 올릴 때 불필요한 object가 계속 쌓이는 문제
- bento media를 final object처럼 취급해 draft sync와 충돌하는 문제
- transaction-local read를 성공 응답으로 오해하는 문제

## Object Key Rules

object key 규칙은 delete, ownership check, cache cleanup의 기준이므로 반드시 고정해야 한다.

### Profile image

고정 슬롯은 사용자당 두 개다.

```text
public/users/{userId}/profile/profile
public/users/{userId}/profile/background
```

`imageKind` 값은 object key suffix와 1:1로 대응해야 한다.

### Bento media temporary upload

temporary upload는 bento item 단위로 object key를 분리해야 한다.

```text
tmp/users/{userId}/profile/bento/{bentoId}/{uuid}
```

최종 object key는 아래다.

```text
public/users/{userId}/profile/bento/{bentoId}/media
```

후속 finalize 계약이 생기기 전까지는 temp object key만 반환하고, final object key로의 copy는 하지 않는다.

### URL to object key reverse lookup

`imageUrl` 또는 `tempUrl`에서 ownership check를 하려면 public URL에서 object key를 역추출할 수 있어야 한다.

- query string의 `?v=`는 cache version이다.
- ownership check는 query string이 아니라 object key 기준으로 해야 한다.
- 같은 object key에 대해 `?v=`만 바뀐 URL은 같은 object로 간주한다.

### Re-upload behavior

profile image는 same-slot overwrite를 허용한다.

- 같은 `imageKind`에 새 이미지를 올리면 기존 object key를 덮어쓴다.
- URL은 content hash 기반으로 바뀔 수 있다.
- same file 재업로드는 client에서 no-op로 처리하는 것이 바람직하다.

bento media temporary upload는 upload attempt마다 새로운 temp object key를 만든다.
같은 bentoId에 다시 업로드하면 이전 temp object는 별도로 정리되거나 sync 단계에서 자연스럽게 무시되어야 한다.

## Ownership and Error Rules

에러 코드는 형식 문제와 소유권 문제를 분리해서 고정하는 편이 가장 구현과 테스트가 단순하다.

권장 규칙:

- `400`: request shape, file type, hash format, missing field, invalid kind
- `403`: authenticated user가 소유하지 않은 object URL 또는 slot ownership mismatch
- `404`: object key는 맞지만 대상 row 또는 object가 존재하지 않음

현재 구현은 일부 ownership 실패를 `400`으로 반환할 수 있으므로, 외부 API로 옮길 때는 위 규칙으로 정규화하는 것을 권장한다.

구체적으로:

- 다른 유저의 `imageUrl`이 들어오면 `403`
- URL은 맞지만 현재 slot과 다르면 `403`
- 이미 삭제된 object를 다시 지우려 하면 `404`
- format만 잘못됐으면 `400`

## Cache and No-Store Rules

이미지 mutation 계열은 캐시가 회귀를 자주 만든다.

- 모든 `POST`, `PATCH`, `DELETE` mutation response는 `Cache-Control: no-store`를 사용한다.
- 가능하면 `Pragma: no-cache`도 같이 유지한다.
- profile image public URL은 `?v={sha256}` 같은 cache-busting query string을 유지한다.
- same content를 다시 업로드하면 same hash이므로 URL version도 같게 유지할 수 있다.
- content가 달라지면 hash가 달라지고, public URL의 `?v=`도 달라져야 한다.
- delete 후 즉시 재업로드는 허용해야 한다.
- finalize 후에는 client가 이전 URL을 stale cache로 보지 않도록 no-store 응답과 versioned URL 둘 다 유지한다.

## Canonical External API Contract

외부 서버로 옮길 때 권장하는 canonical contract는 현재 path semantics를 그대로 유지하는 것이다.
즉, frontend가 바꾸는 범위를 최소화하려면 다음 public contract를 유지하는 편이 안전하다.

```text
POST   /profile/image
PATCH  /profile/image
DELETE /profile/image
POST   /profile/bento/media/upload
```

외부 서버는 이 경로들을 app-owned API로 제공하고, 현재와 같은 JSON contract를 유지해야 한다.

## Validation Rules

외부 서버는 아래 규칙을 다시 검사해야 한다.

### Profile image upload

1. authentication required
2. `file` must be a File
3. `imageKind` must be `profile` or `background`
4. `imageHash` must be a 64-char hex SHA-256 string
5. file type must be JPEG, PNG, WebP, or AVIF
6. file size must be 5MB or smaller
7. uploaded bytes hash must equal `imageHash`

### Profile image finalize

1. authentication required
2. `imageKind` required
3. `imageUrl` required
4. `imageUrl` must map to the authenticated user’s expected stable object key
5. update the matching DB column only

### Profile image delete

1. authentication required
2. `imageUrl` required
3. `imageUrl` must map to the authenticated user’s profile image namespace
4. delete only the object, do not mutate unrelated rows

### Bento media upload

1. authentication required
2. `bentoId` required
3. `file` must be a File
4. file type must be image or video
5. file size must be 5MB or smaller
6. compute `contentHash` before storage write
7. return temporary object metadata for later sync

## Server Responsibilities

외부 서버는 아래 순서를 지키는 편이 안전하다.

```text
1. session/auth check
2. payload validation
3. object key and ownership check
4. storage write or delete
5. DB finalize when applicable
6. committed read response when applicable
7. no-store JSON response
```

특히 다음 금지사항을 지킨다.

- `PATCH /profile/image`를 storage upload와 섞지 않는다.
- `DELETE /profile/image`를 DB finalize와 섞지 않는다.
- `POST /profile/bento/media/upload`에서 final sync write를 하지 않는다.
- transaction 내부 read를 committed read처럼 쓰지 않는다.
- response를 optimistic payload로 조립하지 않는다.

## Migration Checklist

외부 API 서버로 옮길 때는 아래 항목을 함께 닫아야 한다.

```text
1. canonical external path 유지 여부 결정
2. auth/session source 연결
3. profile image upload hash and type validation parity
4. profile image stable object key parity
5. finalize endpoint committed-read parity
6. delete endpoint ownership check parity
7. bento media temporary upload parity
8. no-store JSON contract parity
9. frontend fetch path swap
10. regression tests for upload/finalize/delete flows
```

## Minimal Test Checklist

외부 서버 쪽에서는 최소 아래 케이스를 확인해야 한다.

```text
1. session 없음 -> 401
2. invalid imageKind -> 400
3. invalid imageHash -> 400
4. hash mismatch -> 400
5. invalid file type or size -> 400
6. finalize URL ownership mismatch -> 403
7. delete URL ownership mismatch -> 403
8. delete missing object -> 404
9. bento upload missing bentoId -> 400
10. bento upload invalid media type -> 400
11. upload success returns imageUrl/objectKey metadata
12. successful finalize returns committed DB state
13. delete success confirms deleted object key
14. bento upload returns temporary object metadata only
```

## Related Files

- `src/lib/api/routes/profile.ts`
- `src/lib/api/services/profile.ts`
- `src/lib/profile/image-upload.ts`
- `src/lib/profile/media-upload.ts`
- `src/lib/profile/client-image-upload.ts`
- `src/lib/profile/mutations.ts`
- `src/lib/profile/__test__/profile-image-upload.test.ts`

## Related

- `docs/solutions/best-practices/hono-next-api-boundary-2026-05-03.md`
- `docs/solutions/best-practices/handle-change-external-server-migration-2026-05-08.md`
- `docs/solutions/best-practices/create-onboarding-external-server-migration-contract-2026-05-08.md`
- `docs/solutions/logic-errors/profile-page-image-url-persistence-regression-2026-04-25.md`
