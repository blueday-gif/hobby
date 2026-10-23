# 시설물 상세 페이지 템플릿 및 Supabase 데이터 계획

## 현재 진행 상태

- 설비 상세 페이지 예시: `/equipment/water-tank`에 코드로 작성되어 있음.
- DB 기초 파일: `supabase/migrations/20261016000000_initial_facility_schema.sql` 및 `supabase/seed.sql`을 준비함.
- Next.js 서버 연결 도우미와 `.env.example`을 준비함.
- 아직 원격 개발 DB에 마이그레이션을 적용하지 않았으며, 로그인 화면도 구현하지 않음.

## 목적

시설물마다 페이지 코드를 따로 만들지 않고, 하나의 상세 페이지 템플릿이 Supabase에서 설비 기본정보, 설명 섹션, 사진, 도면, 점검 이력을 읽어 표시한다. 참고한 [지열 냉난방 시스템 기술 글](https://1sible.tistory.com/entry/%EC%A7%80%EC%97%B4-%EB%83%89%EB%82%9C%EB%B0%A9-%EC%8B%9C%EC%8A%A4%ED%85%9C-%EC%A0%95%EC%9D%98-%EC%9E%91%EB%8F%99-%EC%9B%90%EB%A6%AC-%EA%B3%84%ED%86%B5%EB%8F%84-%EC%8B%9C%EC%9A%B4%EC%A0%84-%EC%8B%9C%EA%B3%B5-%EB%B0%A9%EB%B2%95)는 설명과 사진을 주제별로 이어 붙이는 구성이다. 이 문서는 그 시각적 흐름을 설비관리 포털용으로 적용하기 위한 초안이다.

## 페이지 구성안

### 공통 설비 정보 영역

- 경로: 대시보드 → 공종 → 설비명
- 설비명, 관리번호, 공종, 설치 위치
- 운영 상태와 최종 확인 시각
- 사용자가 제공한 핵심 제원만 요약 표시

### 본문: 사진과 텍스트 중심의 섹션

DB의 섹션을 `display_order` 순서로 렌더링한다. 관리자가 섹션을 추가하거나 순서를 바꿀 수 있도록 한다.

1. 설비 개요 / 용도
2. 작동 원리
3. 계통도·구성도
4. 주요 구성 장비
5. 시공·설치 사진 또는 현장 배치
6. 운전 및 점검 방법
7. 주의사항·고장 대응
8. 점검·수리 이력
9. 매뉴얼·도면 첨부

모든 설비에 같은 주제를 강제하지 않는다. 내용이 없는 섹션은 감추고, 필요할 때만 새 섹션을 추가한다. 일반 문단, 제목, 목록, 사진/도면과 캡션을 우선 지원한다. 설비 제원은 별도 표로 입력해도 되고, 기사형 설명 안에 풀어서 쓸 수도 있다.

## 화면·데이터 분리 원칙

- **페이지 템플릿:** 화면의 공통 레이아웃과 표시 규칙. 코드에 한 번 작성한다.
- **설비 레코드:** 실제 현장 설비 한 대 또는 관리 단위 한 개.
- **설명 섹션:** 설비 상세 페이지 본문에 표시될 텍스트와 유형.
- **미디어:** 사진·계통도·도면 파일과 설명/캡션.
- **점검 이력:** 날짜와 결과가 있는 운영 기록. 본문 설명과 섞지 않는다.

같은 템플릿을 사용하되 설비별 본문·이미지·제원·이력은 서로 다르게 저장한다. 예를 들어 지열 히트펌프의 설명 섹션은 계통도와 배관 사진을 포함하고, CCTV 설비는 카메라 위치도와 IP/채널 정보를 포함하도록 한다.

## 권장 URL 구조

- `/` — 시설관리 대시보드
- `/equipment` — 검색·공종·위치별 시설물 목록
- `/equipment/[id]` — DB의 설비 ID로 데이터를 읽는 공통 설비 상세 페이지
- 추후 `/maintenance` — 전체 점검·수리 일정과 작업 관리

`[id]` 경로 하나가 여러 설비 레코드를 표시한다. 새 설비를 등록할 때마다 페이지 코드를 추가하지 않는다.

## Supabase 테이블 초안

### 1. `facilities`

관리 대상 사업장/건물.

| 컬럼 | 용도 |
|---|---|
| `id` | UUID 기본키 |
| `name` | 시설/건물명 |
| `address` | 주소, 선택 |
| `created_at` | 생성 시각 |

### 2. `equipment_categories`

공종 분류. 예: 기계, 전기, 통신·보안, 소방, 승강, 환기.

| 컬럼 | 용도 |
|---|---|
| `id` | UUID 기본키 |
| `name` | 화면 표시명 |
| `sort_order` | 목록 순서 |

### 3. `equipment`

실제 시설물의 기본정보. 여러 건물에서 동일 설비명을 쓰더라도 각각 다른 행이다.

| 컬럼 | 용도 |
|---|---|
| `id` | UUID 기본키, 상세 URL에 사용 |
| `facility_id` | `facilities.id` 참조 |
| `category_id` | `equipment_categories.id` 참조 |
| `name` | 설비명 |
| `asset_code` | 관리번호, 선택 |
| `location` | 동/층/실 등 현장 위치 |
| `status` | 정상/주의/알람/정지 등 통제된 값 |
| `summary` | 한두 줄 설비 설명, 선택 |
| `created_at`, `updated_at` | 생성/수정 시각 |

### 4. `equipment_specs`

설비별 제원. 공종마다 항목이 달라서 공통 컬럼을 과도하게 늘리지 않는다.

| 컬럼 | 용도 |
|---|---|
| `id` | UUID 기본키 |
| `equipment_id` | `equipment.id` 참조 |
| `label` | 항목명. 예: 정격용량, 제조사, 모델명, IP 주소 |
| `value` | 표시할 값 |
| `unit` | 단위, 선택 |
| `sort_order` | 표시 순서 |

### 5. `equipment_sections`

상세 페이지의 사진·텍스트 본문. 제목과 본문을 여러 행으로 저장한다.

| 컬럼 | 용도 |
|---|---|
| `id` | UUID 기본키 |
| `equipment_id` | `equipment.id` 참조 |
| `title` | 섹션 제목. 예: 작동 원리 |
| `section_type` | `text`, `image_gallery`, `diagram`, `checklist` 등 |
| `body` | 본문 텍스트/Markdown, 선택 |
| `display_order` | 페이지 표시 순서 |
| `created_at`, `updated_at` | 생성/수정 시각 |

초기에는 `body`를 제한된 Markdown으로 저장하고, HTML을 그대로 저장해 렌더링하지 않는다. `section_type`은 표시 레이아웃 선택에만 사용하고, 설비별로 임의 HTML을 실행하지 않는다.

### 6. `equipment_media`

Supabase Storage 파일의 메타데이터. 실제 이미지/도면 바이너리는 DB에 넣지 않는다.

| 컬럼 | 용도 |
|---|---|
| `id` | UUID 기본키 |
| `equipment_id` | `equipment.id` 참조 |
| `section_id` | `equipment_sections.id` 참조, 섹션 소속이 아닐 수 있음 |
| `bucket` | Storage 버킷명 |
| `object_path` | Storage 내 파일 경로 |
| `media_type` | `photo`, `diagram`, `drawing`, `manual` 등 |
| `caption` | 사진/도면 캡션 |
| `alt_text` | 대체 텍스트 |
| `display_order` | 표시 순서 |

파일 경로 예시: `facility-id/equipment-id/uuid-original-name.jpg`. 도면·매뉴얼처럼 내부자료는 비공개 버킷을 기본으로 하고, 페이지에서 필요한 경우 권한 확인 뒤 접근 가능한 URL을 발급한다.

### 7. `maintenance_records`

실제 점검/수리 기록과 예정 작업. 본문에 서술된 일반적인 점검 방법과 실제 수행 기록을 구분한다.

| 컬럼 | 용도 |
|---|---|
| `id` | UUID 기본키 |
| `equipment_id` | `equipment.id` 참조 |
| `record_type` | 점검/수리/교체/작업 등 |
| `status` | 예정/진행/완료/조치필요 |
| `scheduled_at` | 예정 시각, 선택 |
| `completed_at` | 완료 시각, 선택 |
| `title` | 작업 제목 |
| `description` | 결과/조치 내용 |
| `created_at` | 생성 시각 |

## 관계 요약

```text
facilities 1 ── N equipment N ── 1 equipment_categories
equipment 1 ── N equipment_specs
equipment 1 ── N equipment_sections 1 ── N equipment_media
equipment 1 ── N equipment_media
equipment 1 ── N maintenance_records
```

## 보안 및 데이터 원칙

- 실제 설비 자료는 공개 웹페이지로 취급하지 않는다. 로그인과 권한 구성을 정한 뒤 테이블과 Storage 버킷에 접근 정책을 둔다.
- 노출되는 테이블은 RLS(Row Level Security)를 활성화하고, 사용자/조직/사업장별로 어떤 설비를 조회·수정할지 정책을 정한다.
- Supabase `service_role` 키는 브라우저 코드나 `NEXT_PUBLIC_` 환경변수에 넣지 않는다.
- 이미지 파일은 Storage에, 파일 설명과 경로는 `equipment_media`에 저장한다.
- 운영 점검 이력을 수정/삭제할 수 있는 역할을 별도로 정한다.
- 예시로 채운 정보는 실제 현장 데이터와 구분하고, 확인되지 않은 제원이나 수치를 만들어 넣지 않는다.

## 구현 순서 제안

1. 실제 사용하는 설비 한 종류(예: 지열 히트펌프)를 골라 상세 페이지 입력 항목과 섹션 구성을 확정한다.
2. 사용자/관리자 역할, 단일 건물인지 여러 건물인지, 파일 공개 범위를 결정한다.
3. Supabase 마이그레이션으로 테이블·외래키·인덱스·RLS 정책을 만든다.
4. `@supabase/supabase-js`와 `@supabase/ssr`를 설치하고 Next.js 서버용 클라이언트를 구성한다.
5. Storage 버킷과 파일 접근 정책을 만든다.
6. `/equipment` 목록을 Supabase 데이터로 바꾼다.
7. `/equipment/[id]`에서 설비, 제원, 섹션, 미디어, 이력을 읽어 공통 템플릿으로 렌더링한다.
8. 관리자 입력 화면과 사진 업로드를 추가한 뒤, 조회/수정 권한을 검증한다.

## 아직 확정이 필요한 항목

- 지열 시스템 한 종류를 먼저 적용할지, 여러 공종을 동시에 지원할지
- 한 사업장만 쓸지, 여러 건물/사업장을 관리할지
- 로그인 사용자와 역할(관리자, 시설 담당자, 읽기 전용 사용자)
- 설명 본문을 Markdown 편집으로 할지, 제목/문단/사진 블록 편집기로 할지
- 사진·도면·매뉴얼의 종류별 업로드 제한과 접근 권한
