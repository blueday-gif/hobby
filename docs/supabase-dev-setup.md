# Supabase 개발 환경 설정

사주취미는 Supabase Auth와 PostgreSQL을 사용한다. 실제 클라우드 연결에는 사용자 소유의 Supabase 프로젝트가 필요하다.

## 1. 프로젝트 준비

Supabase 대시보드에서 개발용 프로젝트를 만들거나 기존 개발 프로젝트를 선택한다. 현재 운영 데이터가 있는 프로젝트에 테스트 스키마나 시드를 적용하지 않는다.

프로젝트의 Project URL과 Publishable key를 확인한다. Secret/service_role 키는 브라우저나 `NEXT_PUBLIC_` 변수에 넣지 않는다.

## 2. 앱 환경 변수

프로젝트 루트에서 `.env.example`을 `.env.local`로 복사하고 다음 값을 설정한다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

`.env.local`은 Git에 커밋하지 않는다. URL이나 키를 채팅에 붙여 넣지 않는다. 값을 수정한 뒤 개발 서버를 재시작한다.

## 3. OAuth

Google·카카오 제공자 설정과 callback URL은 [사주취미 OAuth 안내](./saju-oauth-setup.md)를 따른다. OAuth provider 비밀키는 Supabase 대시보드에만 입력한다.

## 4. 데이터베이스 주의 사항

이 안내서는 Supabase 연결과 인증 설정만 설명한다. 저장소의 `supabase/migrations/`와 `supabase/seed.sql`은 기존 DB 관리 자산으로 보존되어 있으며, 앱 환경변수 설정만으로 실행되거나 적용되지 않는다. 데이터베이스 변경 전 대상 프로젝트와 SQL 내용을 반드시 확인한다.
