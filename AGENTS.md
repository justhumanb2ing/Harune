# Instruction

## 디렉토리 구조

### 루트
- `/scripts` : 일회성 실행 스크립트와 운영용 유틸리티를 둔다.
- `/scripts/_bootstrap` : `bun run script` 실행 전에 공통 환경을 초기화하는 부트스트랩 코드를 둔다.
- `/src` : 실제 애플리케이션 코드가 들어가는 메인 폴더다.
- `/docs/solutions` : 해결한 문제와 설계 판단을 YAML frontmatter(`module`, `problem_type`, `tags`)로 검색 가능하게 기록한 지식 저장소다.

### `src` 하위
- `/src/app` : Next.js App Router 엔트리다. 페이지, 레이아웃, 전역 스타일, 메타데이터, 라우트 핸들러를 둔다.
- `/src/app/(auth)` : 로그인, 회원가입, 비밀번호 재설정 등 인증 관련 화면 그룹이다.
- `/src/app/(docs)` : 문서 페이지 전용 레이아웃과 스타일을 둔다.
- `/src/app/(in-app)` : 로그인 이후 앱 내부 화면에서 사용하는 레이아웃 그룹이다.
- `/src/app/(website-layout)` : 공개 랜딩 페이지와 마케팅 페이지 레이아웃을 둔다.
- `/src/app/api` : API 라우트와 서버 엔드포인트를 둔다.
- `/src/app/super-admin` : 최고 관리자용 화면을 둔다.
- `/src/components` : 재사용 가능한 컴포넌트 폴더다.
- `/src/content` : MD/MDX 기반 콘텐츠 원본을 둔다.
- `/src/db` : DB 연결과 Drizzle ORM 스키마 진입점을 둔다.
- `/src/emails` : React Email 기반 메일 템플릿을 둔다.
- `/src/hooks` : 커스텀 React 훅을 둔다.
- `/src/lib` : 비즈니스 로직, 외부 서비스 연동, 공용 유틸리티를 둔다.

### 작업 원칙
- 새 UI를 추가할 때는 먼저 `/src/components/ui`, `/src/components/layout`, `/src/components/website` 중 어디에 들어가야 하는지 판단한 뒤 배치한다.
- 페이지 라우팅 변경은 `/src/app`, 비즈니스 로직 변경은 `/src/lib`, DB 변경은 `/src/db/schema`에서 우선 찾는다.
- React/Next.js 코드를 작성, 수정, 리팩터링할 때는 `$vercel-composition-patterns`와 `$vercel-react-best-practices` 스킬을 먼저 확인하고 적용한다.
