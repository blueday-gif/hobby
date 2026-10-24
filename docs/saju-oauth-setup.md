# 사주취미 Google·카카오 로그인 설정

로그인 화면은 Supabase Auth OAuth를 사용한다. 앱 코드에는 OAuth 제공자 비밀키를 넣지 않으며, 호스티드 Supabase 프로젝트의 대시보드에 각 제공자 키를 등록한다. 현재 앱의 콜백 경로는 `/saju/auth/callback`이다.

## 먼저 구분할 두 가지 주소

OAuth 설정에는 서로 다른 목적의 주소가 사용된다.

1. **제공자 콘솔의 Redirect URI**: Google Cloud 또는 Kakao Developers에서 발급한 인증 결과를 Supabase로 돌려보내는 주소. Supabase 대시보드의 Google/Kakao 제공자 설정 화면에 표시되는 callback URL을 복사한다. 보통 `https://<project-ref>.supabase.co/auth/v1/callback` 형태다.
2. **Supabase의 Redirect URL 허용 목록**: 인증이 끝난 사용자를 앱으로 돌려보내는 주소. 개발 중에는 `http://localhost:3000/saju/auth/callback`을 추가한다.

두 주소를 서로 바꿔 입력하지 않는다.

## 1. Supabase에서 앱 콜백 허용

1. Supabase 대시보드에서 사주취미 프로젝트를 연다.
2. **Authentication → URL Configuration**으로 이동한다.
3. 개발 중 `Site URL`을 `http://localhost:3000`으로 설정한다.
4. **Redirect URLs**에 `http://localhost:3000/saju/auth/callback`을 추가하고 저장한다.
5. **Authentication → Sign In / Providers**에서 Google 또는 Kakao 제공자 설정을 열어 Provider callback URL을 복사한다. 이 주소를 다음 제공자 콘솔에 붙여 넣는다.

프로젝트 URL이나 키를 채팅에 붙여 넣지 않는다. Provider callback URL을 직접 확인해 사용한다.

## 2. Google Cloud 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트를 선택하거나 새 프로젝트를 만든다.
2. **Google Auth Platform**에서 앱 정보와 OAuth 동의 화면을 설정한다. 테스트 상태로 운영할 경우 테스트 사용자를 등록한다.
3. **Clients → Create client → Web application**에서 OAuth 클라이언트를 만든다.
4. **Authorized redirect URIs**에 Supabase 대시보드 Google 제공자 화면의 callback URL을 추가한다.
5. 생성된 Client ID와 Client secret을 복사한다.
6. Supabase 대시보드의 **Authentication → Sign In / Providers → Google**에서 제공자를 활성화하고 Client ID와 Client secret을 입력해 저장한다.

OAuth client secret은 앱 코드, `.env.local`, Git 저장소에 넣지 않는다.

## 3. Kakao Developers 설정

1. [Kakao Developers](https://developers.kakao.com/)에서 앱을 만들거나 기존 앱을 선택한다.
2. **제품 설정 → 카카오 로그인 → 일반**에서 카카오 로그인 기능을 **활성화 ON**으로 바꾼다.
3. 카카오 로그인 설정의 **Redirect URI**에 Supabase 대시보드 Kakao 제공자 화면의 callback URL을 추가한다.
4. 앱 키에서 **REST API 키**를 확인한다. 카카오 개발자 콘솔의 **Client Secret**을 발급·활성화한다.
5. Supabase 대시보드의 **Authentication → Sign In / Providers → Kakao**에서 제공자를 활성화한다. Client ID에는 REST API 키, Client Secret에는 발급한 secret을 입력하고 저장한다.
6. 이메일을 사용자 정보로 사용할 계획이라면 카카오 동의 항목에서 이메일 사용 가능 여부와 동의 설정도 확인한다. 이메일 제공 여부에 의존하지 않도록 앱은 이메일이 없을 때도 동작한다.

Client Secret은 앱 코드, `.env.local`, Git 저장소에 넣지 않는다.

### KOE004 오류

카카오 화면에서 `KOE004`와 "서비스 설정에 오류가 있어, 이용할 수 없습니다. 서비스 관리자의 확인이 필요합니다."가 보이면 카카오 개발자 콘솔에서 해당 앱을 선택하고 **제품 설정 → 카카오 로그인 → 일반 → 활성화 설정**을 ON으로 저장한다. 이 오류는 앱의 개인정보 동의 체크나 Next.js 콜백 코드 오류가 아니다. 활성화 후 다시 로그인한다.

## 4. 로컬에서 확인

1. 개발 서버를 실행하고 `http://localhost:3000/saju/login`을 연다.
2. Google과 카카오 버튼을 각각 눌러 제공자 인증을 완료한다.
3. 브라우저가 `/saju/auth/callback`으로 돌아온 뒤 `next` 경로로 이동하는지 확인한다.
4. 로컬 테스트 후 Supabase URL Configuration에 실제 배포 도메인의 `/saju/auth/callback`도 추가한다. Google/Kakao 제공자 콘솔의 Redirect URI는 Supabase callback을 사용하므로, 배포 도메인용 제공자 callback을 별도로 추가하는 것이 아니다.

## 저장소 설정 참고

현재 앱은 `signInWithOAuth`와 `/saju/auth/callback` 처리를 이미 구현했다. 호스티드 Supabase를 사용하는 개발 환경에서 제공자 키는 Supabase 대시보드에 저장하므로 `.env.local`에 새 OAuth 비밀키를 추가하거나 로컬 전용 `supabase/config.toml`을 수정할 필요가 없다. 앱의 기존 Supabase URL과 publishable key는 그대로 사용한다.
