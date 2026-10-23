# Supabase 개발 DB 연결 방법

현재 저장소에는 개발용 스키마, 샘플 데이터, Next.js 서버 클라이언트가 준비되어 있다. 실제 클라우드 연결은 계정 소유자의 Supabase 프로젝트가 있어야 진행할 수 있다.

## 1. Supabase 개발 프로젝트 만들기

Supabase 대시보드에서 `facility-dev` 같은 별도 개발 프로젝트를 만든다. 운영 중인 시설 자료 대신 샘플 데이터로 시작한다.

프로젝트의 Project URL과 Publishable key를 확인한다. Secret/service_role 키는 브라우저나 `NEXT_PUBLIC_` 변수에 넣지 않는다.

## 2. 앱 환경 변수 설정

프로젝트 루트 `myprojcet`에서 `.env.example`을 `.env.local`로 복사하고 다음 값을 넣는다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

`.env.local`은 Git에 커밋하지 않는다. URL/키를 채팅에 붙여 넣지 않아도 된다.

## 3. 원격 개발 DB에 마이그레이션 적용

VS Code 터미널에서 프로젝트 폴더를 기준으로 실행한다.

```powershell
npm.cmd exec -- supabase login
npm.cmd exec -- supabase link --project-ref <project-ref>
npm.cmd exec -- supabase db push --include-seed
```

`db push`는 연결된 Supabase DB를 변경하므로 `facility-dev` 개발 프로젝트인지 확인한다. CLI가 DB 비밀번호를 요청하면 Supabase 프로젝트를 만들 때 지정한 비밀번호를 로컬 프롬프트에 입력한다.

## 4. 샘플 데이터 사용자 권한

마이그레이션은 시설별 RLS 정책을 활성화한다. 따라서 로그인 사용자에게 멤버십이 없으면 샘플 설비가 조회되지 않는다. Supabase Auth에 테스트 사용자를 만든 뒤 `facility_members`에 그 사용자 UUID와 샘플 시설 ID를 등록한다.

```sql
insert into public.facility_members (facility_id, user_id, role)
values (
  '00000000-0000-4000-8000-000000000001',
  '<auth-user-uuid>',
  'admin'
);
```

## 5. 현재 연결 상태

- 2026-10-16: 연결된 개발 프로젝트에 초기 마이그레이션과 가상 샘플 데이터 적용을 확인했다.
- 확인한 샘플 데이터: 시설 1개, 공종 6개, 설비 2개, 제원 5개, 콘텐츠 섹션 6개.
- Supabase Auth 테스트 사용자 1명을 샘플 시설 관리자 멤버로 등록했다.
- `/login` 이메일·비밀번호 로그인과 대시보드 로그아웃 기능을 추가했다.
- 대시보드의 공종/설비 목록과 저수조 상세의 설명·제원·점검 이력은 Supabase를 조회한다.
- 일정, 알림, 사진, 계통도는 아직 템플릿 예시다. 현장 자료를 등록한 뒤 DB/Storage 데이터로 교체한다.
