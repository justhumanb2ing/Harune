---
title: SEO content and media context map
date: 2026-04-28
category: documentation-gaps
module: seo-content-media
problem_type: documentation_gap
component: documentation
severity: medium
applies_when:
  - 공개 페이지 메타데이터, sitemap, robots, 정책/문서 콘텐츠를 수정할 때
  - OG/Twitter 이미지 또는 profile image storage를 바꿀 때
  - public URL과 canonical URL 생성 규칙을 확인할 때
tags: [seo, content, media, sitemap, storage, og-image]
---

# SEO content and media context map

## Context
공개 페이지는 SEO와 공유 이미지 품질이 중요하다. 이 프로젝트는 전역 metadata, 페이지별 `createPageMetadata`, dynamic sitemap/robots, public profile OG/Twitter image route, S3/Supabase 호환 media storage를 함께 사용한다.

## Guidance
SEO의 canonical source는 `src/lib/seo/index.ts`다.

```text
appConfig.url
  -> seoConfig.siteUrl
  -> absoluteUrl(path)
  -> metadataBase / canonical / openGraph / twitter / sitemap / robots
```

주요 파일은 다음과 같다.

| File | Responsibility |
|---|---|
| `src/app/layout.tsx` | 전역 metadata, analytics script, root provider |
| `src/lib/seo/index.ts` | `seoConfig`, `absoluteUrl`, `createPageMetadata` |
| `src/app/sitemap.ts` | 정적 페이지, 정책 페이지, 공개 profile page sitemap |
| `src/app/robots.ts` | API/auth/in-app route disallow |
| `src/app/opengraph-image.tsx` | 사이트 기본 OG image |
| `src/app/(public-profile)/[handle]/opengraph-image.tsx` | profile page OG image |
| `src/app/(public-profile)/[handle]/twitter-image.tsx` | profile page Twitter image |
| `src/content/policies/*` | 정책/변경 로그 콘텐츠 |
| `src/content/docs/*` | 문서형 MDX 콘텐츠 |

Media storage는 환경변수에 따라 AWS S3 또는 Supabase S3 호환 endpoint를 쓴다.

```text
getS3StorageConfig()
  -> supabase config exists: Supabase public object URL
  -> otherwise: AWS S3 public object URL
```

Profile image는 slot 기반 object key를 쓴다.

```text
public/users/{userId}/profile-page/profile
public/users/{userId}/profile-page/background
```

## Why This Matters
Canonical URL, sitemap URL, robots sitemap URL이 서로 다른 helper를 쓰면 검색엔진이 서로 다른 사이트로 인식할 수 있다. 공개 profile URL은 handle 기반이지만, robots는 인앱 `/{handle}/app`과 `/{handle}/analytics`를 막아야 한다.

Media URL은 `?v=` cache version을 포함할 수 있다. 저장소 object key 비교와 공개 URL 문자열 비교를 혼동하면 cleanup 또는 no-op upload 판단이 틀어진다.

## When to Apply
- landing, policy, changelog, docs page를 추가할 때
- `appConfig.url`, `NEXT_PUBLIC_APP_URL`, canonical URL을 바꿀 때
- profile page social image 데이터를 바꿀 때
- S3/Supabase storage provider 또는 image remote patterns를 바꿀 때

## Examples
새 공개 페이지 추가 시 확인할 항목:

```text
1. page metadata가 createPageMetadata를 쓰는지
2. canonical path가 실제 route와 맞는지
3. sitemap에 포함해야 하는 공개 route인지
4. robots에서 막아야 하는 private route는 아닌지
5. OG/Twitter image가 기본값으로 충분한지
```

Profile image가 Next image remote pattern에서 깨지면 아래를 확인한다.

```text
1. next.config.ts images.remotePatterns
2. AWS_BUCKET_NAME/AWS_REGION 또는 SUPABASE_S3_ENDPOINT
3. getPublicS3ObjectUrl 결과 host
4. public URL의 object key와 expected key 일치 여부
```

## Related
- `docs/notes/opengraph-image-fonts.md`
- `docs/solutions/documentation-gaps/profile-page-domain-map-2026-04-28.md`
