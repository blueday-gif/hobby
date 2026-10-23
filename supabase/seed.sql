-- Fictional learning data. Do not treat these records as real facility data.
insert into public.facilities (id, name, address)
values ('00000000-0000-4000-8000-000000000001', '샘플 시설', '주소 미입력')
on conflict (id) do nothing;

insert into public.equipment_categories (id, name, slug, sort_order) values
  ('00000000-0000-4000-8000-000000000101', '기계설비', 'mechanical', 1),
  ('00000000-0000-4000-8000-000000000102', '전기설비', 'electrical', 2),
  ('00000000-0000-4000-8000-000000000103', '통신·보안', 'communications', 3),
  ('00000000-0000-4000-8000-000000000104', '소방설비', 'fire', 4),
  ('00000000-0000-4000-8000-000000000105', '건축·승강', 'building', 5),
  ('00000000-0000-4000-8000-000000000106', '환기설비', 'ventilation', 6)
on conflict (id) do nothing;

insert into public.equipment (id, facility_id, category_id, name, asset_code, location, status, summary)
values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', '지하 2층 저수조', 'EX-M-001', 'B2 · 기계실', 'normal', '화면 구조 확인용 예시 설비. 실제 제원과 상태는 미입력.'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', '주차장 CCTV 04', 'EX-C-004', 'B2 · 주차구역 C', 'caution', '화면 구조 확인용 예시 설비. 실제 IP와 상태는 미입력.')
on conflict (id) do nothing;

insert into public.equipment_specs (equipment_id, label, value, sort_order)
values
  ('00000000-0000-4000-8000-000000000201', '유효 용량', '미입력', 1),
  ('00000000-0000-4000-8000-000000000201', '재질 / 구획', '미입력', 2),
  ('00000000-0000-4000-8000-000000000201', '설치 연도', '미입력', 3),
  ('00000000-0000-4000-8000-000000000202', 'IP 주소', '미입력', 1),
  ('00000000-0000-4000-8000-000000000202', '모델명', '미입력', 2)
on conflict do nothing;

insert into public.equipment_sections (equipment_id, title, section_type, body, display_order)
values
  ('00000000-0000-4000-8000-000000000201', '설비 개요', 'text', '화면 구조 확인용 설명입니다. 현장 도면과 명판을 확인해 내용을 작성합니다.', 1),
  ('00000000-0000-4000-8000-000000000201', '작동 원리', 'text', '상수도 인입, 저수조 저장, 수위 감지, 급수 펌프 운전의 흐름을 실제 계통에 맞춰 기록합니다.', 2),
  ('00000000-0000-4000-8000-000000000201', '계통도', 'diagram', '실제 계통도 파일은 별도 첨부가 필요합니다.', 3),
  ('00000000-0000-4000-8000-000000000201', '현장 사진', 'image_gallery', '실제 현장 사진은 별도 업로드가 필요합니다.', 4),
  ('00000000-0000-4000-8000-000000000202', '설비 개요', 'text', '화면 구조 확인용 예시입니다. 실제 위치, IP 주소, 장비 정보는 확인 후 입력합니다.', 1),
  ('00000000-0000-4000-8000-000000000202', '현장 사진', 'image_gallery', '실제 현장 사진은 별도 업로드가 필요합니다.', 2)
on conflict do nothing;

-- Membership is intentionally not seeded because it must reference a real Auth user.
-- After creating a development user, grant access only to the sample facility:
-- insert into public.facility_members (facility_id, user_id, role)
-- values ('00000000-0000-4000-8000-000000000001', '<auth-user-uuid>', 'admin');
