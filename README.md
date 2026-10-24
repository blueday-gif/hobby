# 사주취미

생년월일시를 바탕으로 사주와 오행을 분석해 나에게 맞는 취미를 추천하는 웹 앱입니다.

## 로컬 실행

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

`.env.local`에 Supabase 프로젝트의 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 설정합니다. 비밀 키(service_role/secret)는 사용하지 않습니다.

서비스는 [http://localhost:3000/saju](http://localhost:3000/saju)에서 확인할 수 있습니다. 루트 주소 `/`도 사주취미 화면으로 이동합니다.

## 인증 설정

Google·카카오 OAuth는 [설정 안내](./docs/saju-oauth-setup.md)를 참고합니다. Supabase 개발 환경변수 설정은 [개발 설정 문서](./docs/supabase-dev-setup.md)를 참고합니다.

## 검증

```powershell
npm test
npm run lint
npx tsc --noEmit
```
