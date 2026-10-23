-- ============================================================================
-- 사주취미 (Saju Hobby) — Supabase PostgreSQL 전체 스키마(DDL), RLS 및 36종 템플릿 시드(Seed)
-- Version: 3.1 (2026-10-22)
-- 구성:
--   1. 마스터 템플릿 테이블 4종 (총 36개 콘텐츠)
--      - saju_day_masters (10천간 나만의 캐릭터: 10종)
--      - saju_wellness_templates (오행 신체/건강 웰니스: 과다 5 + 부족 5 + 균형 1 = 11종)
--      - saju_category_templates (3대 대분류 총평: 운동형·지능형·예술형 = 3종)
--      - saju_hobby_templates (12개 소분류 취미 및 동적 변수 치환 템플릿 = 12종)
--   2. 사용자 데이터 테이블 2종 + 공유 뷰 1종
--      - profiles (회원 기본 생년월일시·성별 및 개인정보 동의)
--      - results (사주 판정 결과 및 점수 JSONB 저장)
--      - shared_results_view (생년월일시 원본 마스킹 공개 공유용 뷰)
--   3. Row Level Security (RLS) 정책
--   4. 36종 마스터 템플릿 실제 데이터 INSERT 구문 전체
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 1. 마스터 템플릿 테이블 생성 (DDL)
-- ============================================================================

-- [1-1] 10천간(일간) 나만의 캐릭터 템플릿 테이블 (10종)
CREATE TABLE IF NOT EXISTS public.saju_day_masters (
  stem_code TEXT PRIMARY KEY,              -- 예: 'STEM_GAP'
  stem_ko TEXT NOT NULL,                   -- 예: '갑목'
  stem_hanja TEXT NOT NULL,                -- 예: '甲木'
  element TEXT NOT NULL CHECK (element IN ('wood', 'fire', 'earth', 'metal', 'water')),
  yin_yang TEXT NOT NULL CHECK (yin_yang IN ('yang', 'yin')),
  nickname TEXT NOT NULL,                  -- 캐릭터 별칭 (예: '우뚝 솟은 푸른 거목')
  summary TEXT NOT NULL                    -- 캐릭터 성향 상세 해설
);

-- [1-2] 오행 건강/신체 에너지 웰니스 템플릿 테이블 (11종: 부족 5 + 과다 5 + 균형 1)
CREATE TABLE IF NOT EXISTS public.saju_wellness_templates (
  template_id TEXT PRIMARY KEY,            -- 예: 'WELL_WOOD_DEF', 'WELL_BALANCED'
  element TEXT NOT NULL CHECK (element IN ('wood', 'fire', 'earth', 'metal', 'water', 'all')),
  state TEXT NOT NULL CHECK (state IN ('DEFICIENT', 'EXCESSIVE', 'BALANCED')),
  body_axis TEXT NOT NULL,                 -- 연관 신체 에너지 축
  content TEXT NOT NULL,                   -- 웰니스 & 신체 밸런스 해설 문구
  care_keywords TEXT[] NOT NULL            -- 추천 케어 키워드 배열
);

-- [1-3] 3대 대분류 총평 템플릿 테이블 (3종)
CREATE TABLE IF NOT EXISTS public.saju_category_templates (
  category_code TEXT PRIMARY KEY CHECK (category_code IN ('SPORTS', 'INTELLECT', 'ART')),
  name_ko TEXT NOT NULL,                   -- '운동형' | '지능형' | '예술형'
  core_elements TEXT NOT NULL,             -- 핵심 오행 축 설명
  headline TEXT NOT NULL,                  -- 결과 화면 타이틀 헤드라인
  description TEXT NOT NULL                -- 대분류 성향 총평 본문
);

-- [1-4] 12개 소분류 취미 마스터 및 동적 추천 템플릿 테이블 (12종)
CREATE TABLE IF NOT EXISTS public.saju_hobby_templates (
  hobby_id TEXT PRIMARY KEY,               -- 예: 'SPORTS_01'
  category_code TEXT NOT NULL REFERENCES public.saju_category_templates(category_code),
  name_ko TEXT NOT NULL,                   -- 예: '러닝'
  slug TEXT NOT NULL UNIQUE,               -- 예: 'running'
  primary_element TEXT NOT NULL CHECK (primary_element IN ('wood', 'fire', 'earth', 'metal', 'water')),
  secondary_element TEXT NOT NULL CHECK (secondary_element IN ('wood', 'fire', 'earth', 'metal', 'water')),
  short_copy TEXT NOT NULL,                -- 한 줄 추천 카피
  reason_template TEXT NOT NULL,           -- {{primaryPct}}, {{weakestElementKo}} 포함 동적 템플릿
  starter_guide TEXT NOT NULL,             -- 입문 실행 가이드
  display_order INT NOT NULL
);

-- ============================================================================
-- STEP 2. 사용자 프로필 및 판정 결과 테이블 생성 (DDL)
-- ============================================================================

-- [2-1] 회원 프로필 테이블
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_date DATE NOT NULL,
  birth_time TIME NULL,                    -- 출생시간 모름일 경우 NULL
  calendar_type TEXT NOT NULL DEFAULT 'solar' CHECK (calendar_type IN ('solar', 'lunar', 'leap')),
  gender TEXT NOT NULL CHECK (gender IN ('M', 'F')),
  privacy_agreed BOOLEAN NOT NULL DEFAULT true,
  privacy_agreed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- [2-2] 사주 취미 판정 결과 테이블
CREATE TABLE IF NOT EXISTS public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_date DATE NOT NULL,
  birth_time TIME NULL,
  calendar_type TEXT NOT NULL DEFAULT 'solar' CHECK (calendar_type IN ('solar', 'lunar', 'leap')),
  gender TEXT NOT NULL CHECK (gender IN ('M', 'F')),
  saju_palja JSONB NOT NULL,               -- 4주 8글자 원국 및 일간 코드(stem_code)
  scores JSONB NOT NULL,                   -- { elements, categoryScores, wellness, hobbies }
  top_category TEXT NOT NULL REFERENCES public.saju_category_templates(category_code),
  top_hobby_id TEXT NOT NULL REFERENCES public.saju_hobby_templates(hobby_id),
  stem_code TEXT NOT NULL REFERENCES public.saju_day_masters(stem_code),
  wellness_template_id TEXT NOT NULL REFERENCES public.saju_wellness_templates(template_id),
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_results_user_id_created_at
  ON public.results (user_id, created_at DESC);

-- ============================================================================
-- STEP 3. Row Level Security (RLS) 정책 및 공유 안전 뷰(View)
-- ============================================================================

ALTER TABLE public.saju_day_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saju_wellness_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saju_category_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saju_hobby_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- 마스터 템플릿 4개 테이블은 비회원(anon) 및 회원(authenticated) 모두 읽기(SELECT) 허용
CREATE POLICY "master_day_masters_read_all" ON public.saju_day_masters
  FOR SELECT USING (true);

CREATE POLICY "master_wellness_read_all" ON public.saju_wellness_templates
  FOR SELECT USING (true);

CREATE POLICY "master_categories_read_all" ON public.saju_category_templates
  FOR SELECT USING (true);

CREATE POLICY "master_hobbies_read_all" ON public.saju_hobby_templates
  FOR SELECT USING (true);

-- profiles: 본인(auth.uid() = user_id)만 접근 가능
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- results: 본인(auth.uid() = user_id)만 원본 행 CRUD 가능
CREATE POLICY "results_all_own" ON public.results
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 공유 전용 뷰: 생년월일시(birth_date, birth_time) 원본을 제외하고 캐릭터·웰니스·취미 결과만 공개
CREATE OR REPLACE VIEW public.shared_results_view AS
SELECT
  r.id,
  r.saju_palja,
  r.scores,
  r.top_category,
  ct.name_ko AS top_category_name,
  ct.headline AS top_category_headline,
  r.top_hobby_id,
  ht.name_ko AS top_hobby_name,
  ht.short_copy AS top_hobby_short_copy,
  r.stem_code,
  dm.stem_ko,
  dm.stem_hanja,
  dm.nickname AS day_master_nickname,
  dm.summary AS day_master_summary,
  r.wellness_template_id,
  wt.body_axis AS wellness_body_axis,
  wt.content AS wellness_content,
  wt.care_keywords AS wellness_care_keywords,
  r.created_at
FROM public.results r
JOIN public.saju_category_templates ct ON r.top_category = ct.category_code
JOIN public.saju_hobby_templates ht ON r.top_hobby_id = ht.hobby_id
JOIN public.saju_day_masters dm ON r.stem_code = dm.stem_code
JOIN public.saju_wellness_templates wt ON r.wellness_template_id = wt.template_id
WHERE r.is_public = true;

GRANT SELECT ON public.shared_results_view TO anon, authenticated;

-- ============================================================================
-- STEP 4. 36종 마스터 템플릿 실제 데이터 적재 (SEED DATA)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- [SEED 1] 10천간(일간) 캐릭터 데이터 (10건)
-- ----------------------------------------------------------------------------
INSERT INTO public.saju_day_masters (stem_code, stem_ko, stem_hanja, element, yin_yang, nickname, summary) VALUES
('STEM_GAP', '갑목', '甲木', 'wood', 'yang', '우뚝 솟은 푸른 거목', '곧은 추진력과 리더십으로 새로운 시작을 두려워하지 않으며, 목표를 향해 위로 뻗어 나가는 성장형 에너지입니다.'),
('STEM_EUL', '을목', '乙木', 'wood', 'yin', '바람에 흔들리지 않는 들꽃', '뛰어난 적응력과 유연한 회복탄력성을 지녔으며, 어떤 환경에서도 끈기 있게 자신만의 영역을 넓혀가는 외유내강형입니다.'),
('STEM_BYEONG', '병화', '丙火', 'fire', 'yang', '세상을 비추는 한여름의 태양', '숨김없이 밝고 정열적인 에너지를 발산하며, 주변에 활기를 불어넣고 즉각적인 행동으로 성취를 만드는 활동가입니다.'),
('STEM_JEONG', '정화', '丁火', 'fire', 'yin', '밤하늘을 밝히는 따뜻한 모닥불', '은은하지만 꺼지지 않는 깊은 열정과 집중력을 품고 있으며, 섬세한 감수성과 몰입으로 디테일을 완성하는 장인형입니다.'),
('STEM_MU', '무토', '戊土', 'earth', 'yang', '묵묵히 자리를 지키는 넓은 대지', '흔들림 없는 포용력과 듬직한 안정감을 지녔으며, 다양한 경험과 감각을 자기만의 중심 속에 단단히 쌓아 올리는 유형입니다.'),
('STEM_GI', '기토', '己土', 'earth', 'yin', '생명을 길러내는 비옥한 정원', '실용적이고 세심한 감각으로 일상을 가꾸며, 손끝의 정성과 꾸준한 루틴을 통해 구체적인 결과물을 빚어내는 실속형입니다.'),
('STEM_GYEONG', '경금', '庚金', 'metal', 'yang', '단단하게 벼려진 강철 원석', '명확한 원칙과 과감한 결단력을 지녔으며, 복잡한 문제를 명쾌하게 정리하고 핵심을 돌파하는 승부사적 기질이 강합니다.'),
('STEM_SIN', '신금', '辛金', 'metal', 'yin', '정교하게 세공된 빛나는 보석', '예리한 안목과 치밀한 분석력을 갖추었으며, 완성도 높은 기준과 미적 감각으로 정교한 결과물을 추구하는 완벽주의형입니다.'),
('STEM_IM', '임수', '壬水', 'water', 'yang', '막힘없이 흐르는 깊고 넓은 바다', '풍부한 상상력과 유연한 사고방식으로 큰 그림을 그리며, 새로운 지식과 변화를 스펀지처럼 흡수하는 지혜로운 탐구자입니다.'),
('STEM_GYE', '계수', '癸水', 'water', 'yin', '대지를 적시는 맑고 촉촉한 봄비', '깊은 통찰력과 섬세한 공감 능력을 지녔으며, 조용한 사색과 지적 몰입 속에서 남들이 보지 못하는 영감을 길어 올리는 사색가입니다.')
ON CONFLICT (stem_code) DO UPDATE SET
  nickname = EXCLUDED.nickname,
  summary = EXCLUDED.summary;

-- ----------------------------------------------------------------------------
-- [SEED 2] 오행 건강/신체 에너지 웰니스 템플릿 데이터 (11건: 부족 5 + 과다 5 + 균형 1)
-- ----------------------------------------------------------------------------
INSERT INTO public.saju_wellness_templates (template_id, element, state, body_axis, content, care_keywords) VALUES
('WELL_WOOD_DEF', 'wood', 'DEFICIENT', '근육 · 관절 · 간 피로도', '사주에 뻗어 나가는 목(木) 기운이 다소 부족해 피로가 쌓이면 목·어깨 근육과 관절이 쉽게 굳을 수 있습니다. 굳은 몸을 부드럽게 늘려주는 스트레칭과 유연성 운동으로 시작해 활력을 깨워보세요.', ARRAY['스트레칭', '관절 이완', '산책']),
('WELL_WOOD_EXC', 'wood', 'EXCESSIVE', '자율신경 · 긴장도 · 근육', '사주에 목(木) 기운이 넘쳐 의욕과 추진력이 강하지만, 그만큼 신경계가 쉽게 긴장하고 오버페이스로 피로가 누적되기 쉽습니다. 호흡을 길게 뱉으며 몸의 긴장을 내려놓는 이완 루틴이 꼭 필요합니다.', ARRAY['호흡 조절', '긴장 이완', '페이스 조절']),
('WELL_FIRE_DEF', 'fire', 'DEFICIENT', '심폐 활력 · 혈액순환 · 체온', '사주에 에너지를 데워주는 화(火) 기운이 부족해 손발이 차거나 기초 활력이 쉽게 떨어질 수 있습니다. 심장 박동을 기분 좋게 높이고 땀을 살짝 내어 혈액순환을 깨우는 유산소 액티비티가 큰 도움이 됩니다.', ARRAY['심폐 자극', '유산소', '워밍업']),
('WELL_FIRE_EXC', 'fire', 'EXCESSIVE', '상열감 · 심박 · 수면 리듬', '사주에 타오르는 화(火) 기운이 강해 열정과 에너지가 넘치지만, 열감이 위로 몰리거나 조급함으로 수면 리듬이 흔들리기 쉽습니다. 역동적인 활동으로 열기를 시원하게 발산한 뒤 쿨다운하는 루틴이 최적입니다.', ARRAY['에너지 발산', '쿨다운', '수분 섭취']),
('WELL_EARTH_DEF', 'earth', 'DEFICIENT', '소화기 · 코어 근육 · 생체리듬', '사주에 중심을 잡아주는 토(土) 기운이 부족해 환경이 바뀌면 소화 리듬이 예민해지거나 체력 코어가 흔들리기 쉽습니다. 코어 근육을 단단히 잡고 일정한 시간에 반복하는 규칙적인 취미가 몸의 중심을 세워줍니다.', ARRAY['코어 강화', '규칙적 루틴', '손끝 몰입']),
('WELL_EARTH_EXC', 'earth', 'EXCESSIVE', '기초대사 · 순환 정체 · 복부', '사주에 안정적인 토(土) 기운이 풍부해 지구력이 좋지만, 움직임이 적어지면 에너지가 정체되어 몸이 무거워지기 쉽습니다. 정적인 상태에서 벗어나 전신을 가볍게 순환시키는 리듬감 있는 활동을 곁들여 보세요.', ARRAY['전신 순환', '가벼운 유산소', '리프레시']),
('WELL_METAL_DEF', 'metal', 'DEFICIENT', '호흡기 · 폐활량 · 지구력', '사주에 맑게 수렴하는 금(金) 기운이 부족해 환절기 호흡기가 예민해지거나 긴 호흡을 유지하는 지구력이 아쉬울 수 있습니다. 깊고 규칙적인 호흡법과 폐활량을 길러주는 유산소·수중 운동이 신체 밸런스를 탄탄히 채워줍니다.', ARRAY['폐활량 강화', '복식 호흡', '리듬 유지']),
('WELL_METAL_EXC', 'metal', 'EXCESSIVE', '호흡 긴장 · 피부 건조 · 경직', '사주에 단단한 금(金) 기운이 강해 집중력과 결단력이 뛰어나지만, 자신도 모르게 호흡이 얕아지고 몸과 생각이 경직되기 쉽습니다. 정해진 틀에서 벗어나 감각을 유연하게 풀어주는 예술·창작이나 수중 활동이 조화를 돕습니다.', ARRAY['유연한 이완', '감각 표현', '수분 보충']),
('WELL_WATER_DEF', 'water', 'DEFICIENT', '수분 대사 · 하체 순환 · 휴식', '사주에 흐르는 수(水) 기운이 부족해 몸이 쉽게 건조해지거나 하체 피로와 갈증을 자주 느낄 수 있습니다. 충분한 수분 섭취와 함께 물의 흐름처럼 전신을 부드럽게 순환시키는 수영·요가나 고요한 몰입 취미가 에너지를 채워줍니다.', ARRAY['수분 대사', '하체 스트레칭', '깊은 휴식']),
('WELL_WATER_EXC', 'water', 'EXCESSIVE', '체온 유지 · 부종 · 생각 과잉', '사주에 깊은 수(水) 기운이 많아 사고력이 깊고 침착하지만, 생각이 너무 많아지거나 몸이 차가워져 무기력해지기 쉽습니다. 머릿속 생각을 잠시 멈추고 몸을 따뜻하게 데워주는 역동적인 운동이나 손으로 직접 만드는 메이커 활동이 활력을 줍니다.', ARRAY['체온 상승', '야외 활동', '즉각적 실행']),
('WELL_BALANCED', 'all', 'BALANCED', '오장육부 조화 · 전신 밸런스', '목·화·토·금·수 다섯 기운이 큰 치우침 없이 고르게 분포한 안정적인 신체 에너지를 지녔습니다. 특정 부위의 무리보다 계절과 컨디션에 맞춰 유산소 활동과 정적인 지적·예술적 휴식을 번갈아 즐기면 최상의 컨디션을 유지할 수 있습니다.', ARRAY['올라운드 밸런스', '교차 루틴', '컨디션 관리'])
ON CONFLICT (template_id) DO UPDATE SET
  body_axis = EXCLUDED.body_axis,
  content = EXCLUDED.content,
  care_keywords = EXCLUDED.care_keywords;

-- ----------------------------------------------------------------------------
-- [SEED 3] 3대 대분류 총평 템플릿 데이터 (3건)
-- ----------------------------------------------------------------------------
INSERT INTO public.saju_category_templates (category_code, name_ko, core_elements, headline, description) VALUES
('SPORTS', '운동형', '화(火) · 목(木) 중심', '역동적인 활력과 추진력의 운동형', '사주에 뻗어 나가는 목(木)과 타오르는 화(火)의 생동감이 주도적으로 자리 잡고 있습니다. 머리로만 오래 고민하기보다 직접 몸을 움직여 땀을 흘리고, 눈앞의 기록이나 동작을 성취해 나갈 때 스트레스가 가장 빠르게 해소되는 유형입니다.'),
('INTELLECT', '지능형', '수(水) · 금(金) 중심', '깊은 통찰과 전략적 사고의 지능형', '사주에 지혜로운 수(水)와 명석한 금(金)의 응집력이 두드러집니다. 복잡한 규칙이나 새로운 지식 체계를 분석하고, 조용한 몰입 속에서 나만의 논리와 전략을 완성해 나갈 때 가장 큰 지적 쾌감과 에너지 충전을 경험하는 유형입니다.'),
('ART', '예술형', '토(土) + 오행 균형/혼합', '풍부한 감각과 조화로운 표현의 예술형', '사주에 포용력의 토(土) 기운과 다채로운 오행의 감수성이 조화롭게 어우러져 있습니다. 일상 속 빛·소리·색채·촉감을 남들보다 섬세하게 포착하며, 내면의 감정과 영감을 눈과 손끝의 창작물로 표현할 때 깊은 행복감을 느끼는 유형입니다.')
ON CONFLICT (category_code) DO UPDATE SET
  headline = EXCLUDED.headline,
  description = EXCLUDED.description;

-- ----------------------------------------------------------------------------
-- [SEED 4] 12개 소분류 취미 마스터 및 동적 추천 사유 템플릿 데이터 (12건)
-- ----------------------------------------------------------------------------
INSERT INTO public.saju_hobby_templates (hobby_id, category_code, name_ko, slug, primary_element, secondary_element, short_copy, reason_template, starter_guide, display_order) VALUES
('SPORTS_01', 'SPORTS', '러닝', 'running', 'fire', 'wood',
 '심폐 에너지를 힘차게 발산하며 앞으로 나아가는 추진력의 취미',
 '사주 내 화(火)·목(木) 활동 에너지(주 오행 {{primaryPct}}%)가 역동적으로 작용하여, 심박수를 높이고 앞으로 달리는 러닝에서 답답함이 가장 시원하게 해소됩니다. 특히 {{weakestElementKo}} 기운의 순환을 돕는 규칙적인 호흡 리듬이 신체 활력을 빠르게 끌어올려 줍니다.',
 '러닝화 한 켤레와 20분 인터벌 달리기 앱(런데이 등)으로 오늘 저녁 가볍게 2km부터 시작해 보세요.', 1),

('SPORTS_02', 'SPORTS', '클라이밍', 'climbing', 'wood', 'earth',
 '위로 뻗어 오르는 상승 기운과 전신 밸런스를 결합한 도전',
 '위로 뻗어 오르려는 목(木) 기운({{primaryPct}}%)과 중심을 잡는 토(土) 기운이 만나, 목표 홀드를 향해 한 단계씩 등반하는 클라이밍에서 강렬한 성취감을 느낍니다. 전신 코어와 악력을 고루 사용하여 {{weakestElementKo}} 에너지 밸런스를 잡는 데도 탁월합니다.',
 '동네 실내 볼더링 암장의 일일 체험권(기초 강습 + 암벽화 대여 포함)으로 첫 루트를 완등해 보세요.', 2),

('SPORTS_03', 'SPORTS', '수영', 'swimming', 'water', 'metal',
 '물의 유연한 흐름 속에서 호흡과 리듬을 규칙적으로 제어하는 운동',
 '유연한 수(水) 기운({{primaryPct}}%)과 규칙적인 호흡의 금(金) 기운이 조화를 이루어, 물의 부력 속에서 전신을 리듬감 있게 움직이는 수영과 궁합이 매우 뛰어납니다. 관절에 무리를 주지 않으면서 {{weakestElementKo}} 기운의 전신 순환과 폐활량을 동시에 길러줍니다.',
 '인근 시립 체육센터의 초급 강습반에 등록하거나 주말 자유수영 1회권으로 물과 친해져 보세요.', 3),

('SPORTS_04', 'SPORTS', '요가·필라테스', 'yoga-pilates', 'wood', 'water',
 '근육과 관절을 유연하게 뻗어내며 호흡과 내면의 정렬을 맞추는 수련',
 '신체를 유연하게 확장하는 목(木) 기운({{primaryPct}}%)과 내면의 흐름을 다스리는 수(水) 기운이 어우러져, 호흡과 코어 정렬에 집중하는 요가·필라테스에 깊이 몰입할 수 있습니다. 굳어 있는 근육을 이완하고 {{weakestElementKo}} 에너지의 불균형을 바로잡는 데 최적입니다.',
 '거실에 요가 매트를 펴고 유튜브 15분 모닝 스트레칭·코어 루틴 영상을 따라 하며 호흡을 정돈해 보세요.', 4),

('INTELLECT_01', 'INTELLECT', '독서·글쓰기', 'reading-writing', 'water', 'wood',
 '깊은 사유의 바다에서 통찰을 길어 올려 나만의 문장으로 틔우는 취미',
 '깊은 사색을 상징하는 수(水) 기운({{primaryPct}}%)을 바탕으로 지식을 흡수하고, 이를 목(木)의 생명력 있는 문장으로 엮어내는 능력이 돋보입니다. 조용히 책을 읽고 생각을 기록하는 시간은 과열된 일상을 식히고 {{weakestElementKo}} 기운을 차분히 보완해 줍니다.',
 '하루 15쪽 독서와 인상 깊은 문장 3줄 필사·단상 노트를 작성하는 가벼운 루틴부터 시작해 보세요.', 5),

('INTELLECT_02', 'INTELLECT', '보드게임·체스', 'boardgame-chess', 'metal', 'water',
 '명확한 규칙과 수읽기 속에서 냉철한 판단력과 전략을 겨루는 두뇌 게임',
 '명쾌한 결단력의 금(金) 기운({{primaryPct}}%)과 치밀한 수읽기의 수(水) 기운이 결합되어, 정해진 규칙 안에서 최선의 수를 찾아내는 체스·전략 보드게임에서 두뇌가 반짝입니다. 잡념을 지우고 고도의 집중력을 발휘하며 {{weakestElementKo}} 에너지까지 정돈할 수 있습니다.',
 '스마트폰 체스 앱(Chess.com 등)의 하루 5분 전술 퍼즐 모드나 1인 전략 보드게임으로 가볍게 입문해 보세요.', 6),

('INTELLECT_03', 'INTELLECT', '코딩·메이커', 'coding-maker', 'metal', 'fire',
 '정교한 논리 구조를 설계해 실제로 작동하는 결과물을 구현하는 창작',
 '구조적 논리를 세우는 금(金) 기운({{primaryPct}}%)과 이를 눈에 보이는 결과물로 구현하는 화(火)의 실행력이 만나, 코딩·메이커 활동에서 높은 몰입도를 보입니다. 내 손으로 문제를 해결하고 자동화 도구를 완성하는 과정이 {{weakestElementKo}} 기운의 활력을 자극합니다.',
 '웹 브라우저에서 바로 실행되는 파이썬 기초 튜토리얼이나 노코드 업무 자동화 미니 프로젝트 하나를 만들어 보세요.', 7),

('INTELLECT_04', 'INTELLECT', '외국어 학습', 'foreign-language', 'water', 'fire',
 '새로운 언어 체계를 흡수하고 세상과 넓게 소통하는 지적 확장',
 '유연하게 패턴을 흡수하는 수(水) 기운({{primaryPct}}%)과 외부 세계로 표현을 넓히는 화(火)의 소통 에너지가 조화를 이루어 외국어 학습에 강점이 있습니다. 새로운 언어로 말문이 트이는 자극이 일상의 매너리즘을 깨고 {{weakestElementKo}} 기운에 생기를 불어넣습니다.',
 '하루 10분 회화 앱(듀오링고 등)과 좋아하는 해외 드라마·유튜브 1문장 쉐도잉으로 부담 없이 시작해 보세요.', 8),

('ART_01', 'ART', '그림·드로잉', 'drawing', 'earth', 'wood',
 '일상의 풍경과 감정을 종이 위에 선과 색으로 차분히 담아내는 표현',
 '대상을 차분히 관찰하고 수용하는 토(土) 기운({{primaryPct}}%)과 생동감 있는 선을 뻗어내는 목(木) 기운이 어우러져 그림·드로잉에 천부적인 감각을 발휘합니다. 손끝으로 선과 색을 채워나가는 무념무상의 시간이 {{weakestElementKo}} 에너지의 피로를 부드럽게 다독여 줍니다.',
 '펜 하나와 손바닥만 한 크로키북(또는 태블릿)을 준비해 오늘 마신 커피잔이나 창밖 풍경을 5분간 스케치해 보세요.', 9),

('ART_02', 'ART', '악기 연주', 'instrument', 'fire', 'metal',
 '정교한 음계와 박자 위에서 감정의 울림을 소리로 발산하는 예술',
 '정교한 박자와 음계를 짚어내는 금(金)의 감각과 내면의 감정을 소리로 발산하는 화(火) 기운({{primaryPct}}%)이 만나 악기 연주에서 깊은 카타르시스를 얻습니다. 손끝의 진동과 멜로디에 집중하는 과정이 {{weakestElementKo}} 기운의 긴장을 조화롭게 풀어줍니다.',
 '칼림바·우쿨렐레·미디 키보드 등 집에서도 독학하기 좋은 악기로 가장 좋아하는 노래 1곡 완주에 도전해 보세요.', 10),

('ART_03', 'ART', '사진·영상 촬영', 'photo-video', 'metal', 'earth',
 '찰나의 빛과 구도를 프레임으로 포착해 시간의 기록으로 남기는 작업',
 '찰나의 구도와 빛을 예리하게 포착하는 금(金) 기운({{primaryPct}}%)과 일상의 순간을 묵직한 기록으로 남기는 토(土) 기운이 시너지를 내어 사진·영상 촬영에 탁월한 안목을 보입니다. 시선을 바꿔 세상을 관찰하는 산책이 {{weakestElementKo}} 에너지를 자연스럽게 충전해 줍니다.',
 '스마트폰 카메라의 격자선(Grid) 기능을 켜고 동네 산책길의 빛과 그림자를 10장 찍어 무료 보정 앱으로 색감을 입혀보세요.', 11),

('ART_04', 'ART', '도예·공예', 'pottery-craft', 'earth', 'water',
 '흙과 재료의 물성을 손끝으로 빚어내며 온전한 몰입을 경험하는 수공예',
 '흙과 자연 재료를 뜻하는 토(土) 기운({{primaryPct}}%)과 부드럽게 형태를 빚어내는 수(水)의 유연함이 결합되어 도예·공예에서 깊은 심리적 안정감을 느낍니다. 손끝의 촉각에 온전히 집중하는 시간이 복잡한 생각을 비우고 {{weakestElementKo}} 기운의 균형을 되찾아 줍니다.',
 '주말 공방 원데이 클래스(나만의 머그컵·트레이 만들기)를 예약하거나 홈 에어드라이 클레이 키트로 소품을 빚어보세요.', 12)
ON CONFLICT (hobby_id) DO UPDATE SET
  short_copy = EXCLUDED.short_copy,
  reason_template = EXCLUDED.reason_template,
  starter_guide = EXCLUDED.starter_guide;