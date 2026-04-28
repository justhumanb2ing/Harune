---
title: Account lifecycle and settings context map
date: 2026-04-28
category: documentation-gaps
module: account-lifecycle
problem_type: documentation_gap
component: authentication
severity: high
applies_when:
  - 로그아웃, 계정 삭제, 설정 패널, 현재 페이지 버튼을 수정할 때
  - 계정 삭제가 profile page, sessions, coupons, app cache에 미치는 영향을 확인할 때
  - 앱 내부 navigation과 settings UX를 바꿀 때
tags: [account, settings, sign-out, delete-account, sidebar, session]
---

# Account lifecycle and settings context map

## Context
로그인 후 사용자는 앱 내부 sidebar/settings 패널에서 현재 페이지 확인, analytics 이동, 로그아웃, 계정 삭제를 수행한다. 기존 문서는 인증과 route 보호를 설명하지만, 계정 생명주기 기능이 사용자에게 어떻게 노출되고 어떤 데이터를 정리하는지는 별도로 정리되어 있지 않았다.

## Guidance
앱 내부 shell의 주요 사용자 기능은 다음과 같다.

| Feature | UI/route | Behavior |
|---|---|---|
| Section navigation | Sidebar `Section` | `/{handle}/app`으로 이동 |
| Analytics navigation | Sidebar `Analytics` | `/{handle}/analytics`로 이동 |
| Current page button | App header/sidebar | 현재 공개 페이지 URL 표시/이동 |
| Settings panel | Sidebar expanded state | 사용자 page name/image/handle 표시 |
| Log out | Settings action | Better Auth signOut, app query clear, `/sign-in` 이동 |
| Delete account | Settings alert dialog | Better Auth deleteUser, app query clear, `/sign-in` 이동 |

주요 파일은 다음과 같다.

| File | Responsibility |
|---|---|
| `src/components/sections/sidebar.tsx` | 앱 navigation, settings panel, sign out, delete account |
| `src/components/layout/current-page-button.tsx` | 현재 public page URL 표시 |
| `src/lib/auth-client.ts` | Better Auth React client |
| `src/auth.ts` | delete user hook과 session/coupon cleanup |
| `src/lib/react-query/app-cache.ts` | authenticated app query clear/invalidate |
| `src/lib/users/useUser.ts` | sidebar에 필요한 user/profilePage data |

로그아웃 흐름:

```text
user clicks Log Out
  -> authClient.signOut()
  -> clearAuthenticatedAppQueries(queryClient)
  -> close settings panel
  -> router.push("/sign-in")
  -> router.refresh()
```

계정 삭제 흐름:

```text
user opens Delete Account dialog
  -> confirm delete
  -> authClient.deleteUser({ callbackURL: "/sign-in" })
  -> Better Auth deleteUser hooks
  -> clearAuthenticatedAppQueries(queryClient)
  -> router.replace("/sign-in")
  -> router.refresh()
```

서버 측 delete hook은 `src/auth.ts`에 있다.

```text
beforeDelete(user)
  -> delete authSessions for user
  -> set coupons.userId = null
```

Profile page와 child rows는 DB foreign key cascade에 의존한다.

```text
app_user
  -> profile_page userId onDelete cascade
  -> profile social/link/text rows cascade through profile_page
```

## Why This Matters
계정 삭제는 단순 UI action이 아니라 인증 세션, profile page, 링크 데이터, coupons, 클라이언트 캐시를 함께 다룬다. fresh session 요구로 실패할 수 있고, 실패 시 사용자는 다시 로그인하라는 메시지를 받는다.

삭제 경고 문구는 “account, profile page, links, analytics credits, active sessions”를 제거한다고 말한다. 실제 DB cascade와 외부 analytics/storage cleanup 범위가 이 문구와 맞는지 기능 변경 때마다 확인해야 한다.

## When to Apply
- Sidebar settings UI나 app navigation을 바꿀 때
- Better Auth deleteUser hook을 바꿀 때
- profile page, coupon, session foreign key를 바꿀 때
- 계정 삭제 후 남는 storage object나 analytics data 처리 정책을 정할 때

## Examples
계정 삭제 문제를 디버깅할 때:

```text
1. authClient.deleteUser가 fresh session error를 반환하는지
2. auth.ts beforeDelete hook이 실행되는지
3. authSessions가 삭제되는지
4. coupons.userId가 null 처리되는지
5. profile_page와 child rows가 cascade 삭제되는지
6. query cache가 clear되고 /sign-in으로 이동하는지
```

Sidebar navigation 문제를 디버깅할 때:

```text
1. useUser()가 profilePage.handle을 갖고 있는지
2. handle 없을 때 /post-sign-in fallback으로 가는지
3. active route 판정이 pathname과 href prefix를 맞게 비교하는지
4. expanded panel이 route change 또는 Escape로 닫히는지
```

## Related
- `docs/solutions/documentation-gaps/auth-navigation-and-cache-boundaries-2026-04-28.md`
- `docs/solutions/documentation-gaps/data-model-and-migration-map-2026-04-28.md`
- `docs/solutions/documentation-gaps/frontend-ui-composition-map-2026-04-28.md`
