# 사주취미 작업 인수인계 (2026-10-23 기준)

> 다음 세션의 AI(Claude 등)는 이 파일과 `docs/Prd.md`, `docs/Schema And Seed.sql`을 먼저 읽고 이어서 작업한다.
> 사용자(Choi)는 Supabase·터미널 **완전 초보**라서 한 단계씩 천천히, 클릭할 메뉴 이름까지 알려줘야 한다.

## 1. 프로젝트 위치와 실행
- 작업 폴더: `D:\test-cursor\myprojcet` (Next.js 16.4.2 / React 19.3 / Tailwind 4, `cacheComponents: true`)
- **반드시 이 폴더에서** `npm run dev` 실행 (`homework` 폴더는 빈 템플릿이라 사용하지 않음. 삭제해도 됨)
- 사주 화면은 `/saju` 아래에 있고, 루트(`/`, `/login`, `/equipment`)는 기존 시설관리 앱이라 건드리지 않는다
- Next.js 16은 기존 지식과 다른 점이 있으니 코드 쓰기 전 `node_modules/next/dist/docs/`를 참고 (AGENTS.md 안내)
- 사용자 PC 파일은 `D:\` 아래만 접근 가능. 명령 실행은 Desktop Commander(PowerShell), 파일 쓰기는 Filesystem 도구 (Edit 도구는 사용자 PC 경로에 못 씀 → write_file로 전체 재작성)

## 2. 완료된 것
- Milestone 1: `lib/saju/` 판정 엔진·36종 템플릿 (PRD 4장과 대조 완료, 일치). `npm test` 20개 통과
- **음력 버그 수정**: 만세력 라이브러리 `lunarToSolar`가 약 9.5% 날짜에서 오류 → `lib/saju/calculator.ts`에 `solarToLunar` 역탐색 우회 추가, `tests/lunar.test.ts` 추가
- Supabase: 새 프로젝트 `saju-hobby`(서울) 생성, `.env.local`의 URL·publishable key 교체, `Schema And Seed.sql` 실행 완료 (테이블 6개 + 뷰 1개 + 36종 시드)
- 라우트 (모두 `app/saju/` 아래, tsc·eslint 통과):
  - `/saju` 랜딩, `/saju/input` 입력, `/saju/result` 비회원 결과(localStorage)
  - `/saju/login`(카카오·구글 버튼), `/saju/auth/callback`, `/saju/result/migrate`(임시결과 DB 이월)
  - `/saju/result/[id]` 회원 결과+공유 켜기/끄기, `/saju/share/[id]` 공유 페이지(생년월일시 비공개)
- `proxy.ts` matcher에 `/saju/:path*` 추가 완료
- 사용자가 브라우저에서 비회원 체험(양력·음력)이 잘 되는 것까지 확인함
- **(2026-10-23 추가) 마이페이지 `/saju/mypage` 구현 완료**: 이메일 표시·로그아웃, 프로필 수정, 결과 기록 목록·삭제(`_components/delete-result-button.tsx`), 비로그인 시 로그인으로 이동
- **(2026-10-23 추가) 이메일+비밀번호 가입/로그인 완료**: `actions.ts`의 `signUpWithEmail`·`signInWithEmail`, `login-buttons.tsx`(가입/로그인 탭 + 카카오·구글 버튼 유지), 비밀번호 규칙은 `lib/saju/password-rules.ts`(최소 6자). 사용자가 Supabase 대시보드에서 `Confirm email`을 이미 끔. 사용자가 가입·마이페이지 동작을 브라우저에서 직접 확인함
- **(2026-10-23 추가) 개발 화면 `4 Issues`(Blocking Route / Date.now()) 해결**: `lib/saju/data.ts`의 `getSessionUser()` 맨 앞에 `await connection()` 추가. 로그인 확인(Supabase)이 현재 시각을 써서 미리 만들 수 없다는 경고였고, 이 한 줄로 마이페이지·입력·로그인·결과 상세 4개 화면의 이슈가 모두 사라짐

## 3. 남은 작업 (순서대로)
1. ✅ 완료 — **마이페이지 `/saju/mypage` (3-4단계)** (아래는 구현 당시 명세)
   - 내 이메일 표시 + 로그아웃(`signOutSaju` 서버 액션 이미 있음)
   - 프로필 수정: `<InputForm mode="profile" isMember needsConsent={!profile} initial={...} />` (`getProfile`, `profileToInput` in `lib/saju/data.ts`)
   - 결과 기록 목록: `listOwnResults`, 삭제는 `deleteResult` 서버 액션, 목록 CSS 클래스 `sj-history`, `sj-history-item` 준비되어 있음
   - 비로그인이면 `/saju/login?next=%2Fsaju%2Fmypage`로 보냄
2. ✅ 완료 — **로그인 페이지에 이메일+비밀번호 가입/로그인 추가** (사용자 요청: 이메일·비밀번호만으로 간단히 가입, 비밀번호 4자리 이상, 카카오·구글도 유지)
   - `app/saju/actions.ts`에 `signUpWithEmail`, `signInWithEmail` 서버 액션 추가, `_components/login-buttons.tsx`에 가입/로그인 탭 + 개인정보 동의 체크박스 공용
   - 가입 성공 시 `safeNext(next)`로 이동 (기본 `/saju/result/migrate`)
   - **주의 1**: Supabase 비밀번호 최소 길이는 `config.toml` 주석 기준 **최소 6** → 4자리는 Supabase가 거부함. 사용자에게 6자리 이상으로 안내하고 동의받을 것 (우회 꼼수는 쓰지 않는다)
   - **주의 2**: 호스티드 Supabase는 기본으로 "Confirm email"이 켜져 있음 → 바로 가입되게 하려면 대시보드 Authentication → Sign In / Providers → Email에서 `Confirm email` 끄기 (사용자가 직접 해야 함). 켜져 있을 때 `signUp`은 세션이 없으므로 "인증 메일 확인" 안내 문구를 보여줄 것
3. 카카오·구글 로그인 설정 (사용자가 나중에 하기로 함): Supabase Authentication → Providers에서 키 입력, Redirect URLs에 `http://localhost:3000/saju/auth/callback` 추가
4. 전체 흐름 직접 클릭 테스트 (로그인 → 이월 저장 → 전체 순위 → 공유 링크 → 마이페이지)
5. Vercel 배포 (사용자가 나중에): 환경변수 2개(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) 입력, 배포 주소의 `/saju/auth/callback`을 Supabase Redirect URLs에 추가

## 4. 알아둘 점
- `npx tsc --noEmit`에서 `app/equipment/water-tank/page.tsx` 오류 2건은 기존 시설 앱의 것이라 이번 작업과 무관
- `"use server"` 파일(`app/saju/actions.ts`)은 async 함수 외의 값(상수 등)을 export할 수 없다. 상수는 `lib/saju/` 아래 별도 파일로 둘 것
- 쿠키(로그인 정보)를 읽는 서버 컴포넌트는 `getSessionUser()`를 통해서 읽으면 `connection()`이 먼저 호출되어 Blocking Route 경고가 나지 않는다
- ✅ **남은 작업 4번(전체 흐름 직접 클릭 테스트) 완료 (2026-10-23)**: 비회원 결과 → 이메일 로그인 → 자동 저장 → 전체 순위 → 공유 링크 켜기/끄기 → 마이페이지 목록까지 사용자가 직접 확인했고 이상 없음
- **남은 일**: 3번 카카오·구글 로그인 설정(사용자가 나중에), 5번 Vercel 배포(사용자가 나중에). 배포 전에 루트(`/`)에 기존 시설ON 포털 로그인이 뜨는 문제를 정리할 것(루트에서 `/saju`로 리다이렉트하거나 사주취미를 별도 프로젝트로 분리). 디자인 변경은 사용자가 나중에 하기로 함
- 없는 공유 링크는 화면은 "찾을 수 없음"이지만 HTTP 200으로 나옴 (cacheComponents 스트리밍 특성, 문제 아님)
- 비밀키(secret / service_role)는 절대 코드나 대화에 넣지 않는다. `.env.local` 값도 대화에 붙여넣지 않게 안내
- PRD와 다른 점 하나(의도적): 오행 비율 정규화를 최대잔여법으로 해서 합계가 정확히 100.0이 되게 함
