---
title: 사주 기반 취미 발견 서비스 상세 제품 요구사항 정의서 (PRD)
service_name: 사주취미 (Saju Hobby)
version: 3.1
status: 구현 확정 (Implementation Ready — 36종 템플릿 & DB 시드 포함)
date: 2026-10-22
supersedes:
  - 사주 기반 취미 발견 서비스 PRD v3.0
  - 사주 기반 취미 발견 서비스 PRD v2.1
  - Project Master Documentation v1.0 (1.2절 비운세 원칙 폐기)
tech_stack:
  - Next.js 14+ (App Router)
  - TypeScript 5+
  - React 18+
  - Tailwind CSS 3+
  - Supabase (Auth / PostgreSQL / RLS)
  - Vercel
  - 만세력 라이브러리 (manseryeok / @fullstackfamily/manseryeok)
  - Vitest (단위 테스트)
authors: [PM / 기획 / 프론트엔드·백엔드 설계]
---

# 사주취미 (Saju Hobby) 상세 PRD — 구현 완성을 위한 전체 명세서 (v3.1)

> **핵심 아키텍처 원칙 요약**
> 1. **과제 필수 분류 체계 절대 불변**: 3대 대분류(**운동형 / 지능형 / 예술형**)와 **12개 소분류 취미** 체계는 과제 필수 요구사항이므로 명칭과 구조를 절대 변경하지 않는다.
> 2. **판정 엔진으로서의 사주**: 사주(만세력·오행)는 3분류와 소분류 취미를 **"어떻게 판정하고 정렬할 것인가"**를 결정하는 규칙 기반 알고리즘(Rule-based Engine)으로 사용한다.
> 3. **36종 모듈형 템플릿 + 동적 수치 치환**: 실시간 AI 생성의 비결정성과 비용 없이도 상용 운세/웰니스 서비스 수준의 몰입감을 제공하기 위해 **① 10천간 캐릭터(10종) + ② 오행 건강/신체 에너지 웰니스(11종: 과다 5·부족 5·균형 1) + ③ 3대 대분류 총평(3종) + ④ 12개 취미 동적 추천 사유(12종)** 총 **36종 마스터 템플릿**과 **오행 비율(%) 변수 치환**을 결합한다.
> 4. **결정론적 순수 함수**: 동일한 생년월일시·역법·성별 입력에 대해 언제나 100% 동일한 오행 분포, 웰니스 분석, 추천 결과가 반환되어야 하며, 판정 로직은 순수 함수 `judge(saju) → JudgeResult`로 구현한다.

## 1. 제품 개요 및 목표

### 1.1 제품 비전과 문제 정의
사용자가 자신의 성향에 맞는 새로운 취미를 찾고자 할 때, 수십 문항의 심리 검사(MBTI 유사 테스트 등)는 응답 피로도가 높고 진입 장벽이 존재한다. **사주취미(Saju Hobby)**는 누구나 이미 알고 있는 **생년월일시** 입력만으로 만세력 기반 사주 팔자(四柱八字)와 오행(五行: 목·화·토·금·수) 에너지 분포를 즉시 산출하고, **나만의 일간 캐릭터·오행 신체 밸런스(웰니스 팁)·운동형/지능형/예술형 3분류 및 12개 입문형 취미**를 **1분 이내**에 추천하는 웹 애플리케이션이다.

### 1.2 성공 지표 (Success Criteria)
| 지표 구분 | 목표 기준 | 측정 및 검증 방법 |
| :--- | :--- | :--- |
| **사용자 완료 시간 (TTV)** | 생년월일시 입력 시작부터 결과 화면 렌더링까지 **60초 이내** (연산 시간 **50ms 이하**) | 브라우저 Performance API 및 E2E 플로우 측정 |
| **결정론적 일관성 (Determinism)** | 동일한 입력(`BirthInput`)에 대해 언제나 **100% 동일한 분류 점수, 취미 순위, 웰니스 해설** 반환 | Vitest 기반 순수 함수 단위 테스트 (100% 통과 필수) |
| **회원 전환 및 결과 이월율** | 비회원 체험 후 소셜 로그인 시 **재입력 없이 100% 결과 자동 저장 및 상세 순위 해금** | OAuth 콜백 후 `pendingResult` DB 적재 성공 여부 검증 |
| **보안 및 데이터 격리** | 타 사용자의 개인정보(생년월일시) 및 비공개 결과 접근 **0건** | Supabase PostgreSQL RLS(Row Level Security) 정책 검증 |

### 1.3 MVP 포함 및 제외 범위
| 구분 | 상세 항목 | 비고 |
| :--- | :--- | :--- |
| **MVP 포함 (In-Scope)** | • 양력/음력(평달·윤달) 생년월일시 및 성별 입력 폼 (`시간 모름` 포함)<br>• 만세력 기반 사주 8글자(또는 삼주 6글자) 및 오행 분포 정규화 계산<br>• **36종 마스터 템플릿 기반 개인화 리포트 생성**:<br>  - 10천간(일간) 나만의 캐릭터 별칭 및 기질 정의 (10종)<br>  - 오행 신체 에너지 & 건강 웰니스 가이드 (과다 5종 + 부족 5종 + 균형형 1종 = 11종)<br>  - 3대 대분류(운동형/지능형/예술형) 총평 (3종)<br>  - 12개 소분류 취미 추천 사유 (사용자 오행 `%` 수치 동적 치환 적용, 12종)<br>• 비회원 요약 결과 화면 및 회원가입 시 결과 자동 이월(Migration)<br>• 회원 전용 12개 취미 전체 순위 조회, 결과 저장/재조회(마이페이지), 공유 링크 생성 | 과제 제출 및 상용 수준 웹사이트 완성을 위한 필수 구현 범위 |
| **MVP 제외 (Out-of-Scope)** | • 대운·세운·월운 등 시기별 길흉화복 점술 풀이 및 의학적 질병 진단<br>• 타인과의 사주 궁합 및 취미 모임 매칭 커뮤니티<br>• 유료 상담 결제 및 AI 자유 채팅 상담 | 의료법 리스크 방지 및 취미 발견 본질 유지 |

## 2. 타겟 페르소나 및 핵심 사용자 시나리오

### 2.1 주요 사용자 유형
| 페르소나 | 특징 및 니즈 | 핵심 진입 경로 및 행동 패턴 |
| :--- | :--- | :--- |
| **가벼운 체험형 방문자 (비회원)** | "내 사주 오행으로 보는 내 캐릭터와 취미가 뭘까?" 호기심으로 접속하지만, 처음부터 회원가입을 요구하면 이탈함 | 랜딩 페이지 → 가입 없이 생년월일시 입력 → 일간 캐릭터 + 오행 웰니스 요약 + 1순위 분류 및 대표 취미 1개 즉시 확인 |
| **결과 수집·공유형 사용자 (전환 회원)** | 1위 취미 외에 나머지 11개 취미의 적합도 순위가 궁금하고, 친구에게 내 캐릭터와 결과를 공유하거나 저장해 두고 싶음 | 비회원 결과 화면에서 `전체 12개 순위 보기 / 저장하기` 클릭 → 3초 소셜 로그인 → 자동 저장된 상세 결과 확인 및 링크 공유 |
| **재방문 회원 (기존 회원)** | 이전에 확인했던 내 취미 순위와 웰니스 팁을 다시 보거나 가족/지인 사주를 추가로 넣어보고 싶음 | 로그인 → 마이페이지(`/saju/mypage`)에서 저장된 프로필 및 과거 결과 리스트 즉시 열람 |

### 2.2 종단간(End-to-End) 사용자 흐름도
1. **랜딩 (`/saju`)**: 서비스 소개, 10천간 캐릭터 & 3분류·12취미 미리보기 카드 확인 후 `[내 사주 취미 찾기]` CTA 클릭
2. **정보 입력 (`/saju/input`)**:
   - 회원인 경우 저장된 `profiles` 정보 자동 프리필(Pre-fill) 제공
   - 생년월일(YYYY-MM-DD), 달력 유형(양력/음력 평달/음력 윤달), 출생시간(12시진 선택 또는 정확한 시·분, `출생시간 모름` 체크박스), 성별(남/여) 입력
3. **사주·오행 계산 및 36종 템플릿 매핑 (클라이언트/서버 순수 함수)**:
   - 만세력 엔진이 사주 팔자 추출 → 오행(목·화·토·금·수) 백분율 정규화 → `judge(saju)`가 ① 일간 캐릭터(10종 중 1), ② 오행 건강/웰니스 팁(11종 중 1~2), ③ 3분류 총평(3종 중 1), ④ 12개 소분류 취미 순위 및 동적 수치 치환 문구 생성
4. **결과 확인 (`/saju/result` 또는 `/saju/result/[id]`)**:
   - **비회원 (`/saju/result`)**: 일간 캐릭터 카드 + 오행 분포 & 신체 웰니스 요약 + 1순위 대분류 배지 + 1위 소분류 취미 상세 카드 노출. 2~12위 전체 순위표는 블러(Blur) 처리 및 `[로그인하고 12개 전체 순위 열람·저장하기]` 버튼 노출
   - **회원 (`/saju/result/[id]`)**: 결과가 Supabase `results` 테이블에 즉시 저장되며, 1~12위 전체 취미 점수와 오행 매칭 해설, `[공유 링크 복사]` 기능 활성화
5. **비회원 → 회원 이월 (`/saju/login` → `/saju/auth/callback` → `/saju/result/[id]`)**:
   - 비회원이 결과 화면에서 로그인 클릭 시 현재 판정 데이터를 `localStorage`(`saju_pending_result`)에 임시 보관 → 소셜 로그인 및 개인정보 동의 완료 시 DB에 자동 insert 후 `/saju/result/[id]`로 이동

## 3. 분류 체계 및 36종 마스터 콘텐츠 템플릿 전체 명세

상용 서비스 수준의 개인화 품질을 보장하기 위해 시스템에서 사용하는 **총 36종 템플릿(10천간 캐릭터 10종 + 오행 웰니스 11종 + 대분류 총평 3종 + 소분류 취미 12종)**의 전체 문구와 매핑 규칙을 확정한다.

### 3.1 [템플릿 그룹 1] 10천간(일간) 나만의 캐릭터 템플릿 (10종)
사주에서 '나 자신(본원)'을 뜻하는 **일간(日干)**에 따라 부여되는 캐릭터 별칭과 핵심 성향이다.

| 천간 코드 | 한글/한자 | 오행/음양 | 캐릭터 별칭 (`nickname`) | 캐릭터 성향 요약 (`summary`) |
| :--- | :---: | :---: | :--- | :--- |
| `STEM_GAP` | 갑목(甲木) | 목(木) / 양 | **우뚝 솟은 푸른 거목** | 곧은 추진력과 리더십으로 새로운 시작을 두려워하지 않으며, 목표를 향해 위로 뻗어 나가는 성장형 에너지입니다. |
| `STEM_EUL` | 을목(乙木) | 목(木) / 음 | **바람에 흔들리지 않는 들꽃** | 뛰어난 적응력과 유연한 회복탄력성을 지녔으며, 어떤 환경에서도 끈기 있게 자신만의 영역을 넓혀가는 외유내강형입니다. |
| `STEM_BYEONG` | 병화(丙火) | 화(火) / 양 | **세상을 비추는 한여름의 태양** | 숨김없이 밝고 정열적인 에너지를 발산하며, 주변에 활기를 불어넣고 즉각적인 행동으로 성취를 만드는 활동가입니다. |
| `STEM_JEONG` | 정화(丁火) | 화(火) / 음 | **밤하늘을 밝히는 따뜻한 모닥불** | 은은하지만 꺼지지 않는 깊은 열정과 집중력을 품고 있으며, 섬세한 감수성과 몰입으로 디테일을 완성하는 장인형입니다. |
| `STEM_MU` | 무토(戊土) | 토(土) / 양 | **묵묵히 자리를 지키는 넓은 대지** | 흔들림 없는 포용력과 듬직한 안정감을 지녔으며, 다양한 경험과 감각을 자기만의 중심 속에 단단히 쌓아 올리는 유형입니다. |
| `STEM_GI` | 기토(己土) | 토(土) / 음 | **생명을 길러내는 비옥한 정원** | 실용적이고 세심한 감각으로 일상을 가꾸며, 손끝의 정성과 꾸준한 루틴을 통해 구체적인 결과물을 빚어내는 실속형입니다. |
| `STEM_GYEONG` | 경금(庚金) | 금(金) / 양 | **단단하게 벼려진 강철 원석** | 명확한 원칙과 과감한 결단력을 지녔으며, 복잡한 문제를 명쾌하게 정리하고 핵심을 돌파하는 승부사적 기질이 강합니다. |
| `STEM_SIN` | 신금(辛金) | 금(金) / 음 | **정교하게 세공된 빛나는 보석** | 예리한 안목과 치밀한 분석력을 갖추었으며, 완성도 높은 기준과 미적 감각으로 정교한 결과물을 추구하는 완벽주의형입니다. |
| `STEM_IM` | 임수(壬水) | 수(水) / 양 | **막힘없이 흐르는 깊고 넓은 바다** | 풍부한 상상력과 유연한 사고방식으로 큰 그림을 그리며, 새로운 지식과 변화를 스펀지처럼 흡수하는 지혜로운 탐구자입니다. |
| `STEM_GYE` | 계수(癸水) | 수(水) / 음 | **대지를 적시는 맑고 촉촉한 봄비** | 깊은 통찰력과 섬세한 공감 능력을 지녔으며, 조용한 사색과 지적 몰입 속에서 남들이 보지 못하는 영감을 길어 올리는 사색가입니다. |

### 3.2 [템플릿 그룹 2] 오행 건강/신체 에너지 웰니스 템플릿 (11종: 과다 5 · 부족 5 · 균형 1)
의학적 질병 진단이 아닌 **전통 오행 장부론 기반의 라이프스타일 웰니스 가이드**로 표현하여 법적 리스크를 예방하고 취미 추천의 설득력을 높인다.
- **판정 기준**:
  1. **균형형(`BALANCED`)**: 5행 중 최고 비율($\max E$)과 최저 비율($\min E$)의 차이가 **15%p 이하**인 경우 (억지로 부족/과다를 지적하지 않고 균형 템플릿 출력)
  2. **불균형형(`DEFICIENT` / `EXCESSIVE`)**: 최고-최저 차이가 15%p를 초과할 때, 가장 낮은 오행의 `DEFICIENT`(보완 가이드)를 기본 출력하고, 만약 최고 오행이 **35% 이상**이면 해당 오행의 `EXCESSIVE`(발산/조절 가이드)를 함께 표시한다.

| 템플릿 ID | 오행 구분 | 상태 구분 | 연관 신체 에너지 축 | 웰니스 & 신체 밸런스 해설 문구 (`content`) | 추천 케어 키워드 |
| :--- | :---: | :---: | :--- | :--- | :--- |
| `WELL_WOOD_DEF` | 목(木) | 부족 (`DEFICIENT`) | 근육 · 관절 · 간 피로도 | 사주에 뻗어 나가는 목(木) 기운이 다소 부족해 피로가 쌓이면 목·어깨 근육과 관절이 쉽게 굳을 수 있습니다. 굳은 몸을 부드럽게 늘려주는 스트레칭과 유연성 운동으로 시작해 활력을 깨워보세요. | 스트레칭, 관절 이완, 산책 |
| `WELL_WOOD_EXC` | 목(木) | 과다 (`EXCESSIVE`) | 자율신경 · 긴장도 · 근육 | 사주에 목(木) 기운이 넘쳐 의욕과 추진력이 강하지만, 그만큼 신경계가 쉽게 긴장하고 오버페이스로 피로가 누적되기 쉽습니다. 호흡을 길게 뱉으며 몸의 긴장을 내려놓는 이완 루틴이 꼭 필요합니다. | 호흡 조절, 긴장 이완, 페이스 조절 |
| `WELL_FIRE_DEF` | 화(火) | 부족 (`DEFICIENT`) | 심폐 활력 · 혈액순환 · 체온 | 사주에 에너지를 데워주는 화(火) 기운이 부족해 손발이 차거나 기초 활력이 쉽게 떨어질 수 있습니다. 심장 박동을 기분 좋게 높이고 땀을 살짝 내어 혈액순환을 깨우는 유산소 액티비티가 큰 도움이 됩니다. | 심폐 자극, 유산소, 워밍업 |
| `WELL_FIRE_EXC` | 화(火) | 과다 (`EXCESSIVE`) | 상열감 · 심박 · 수면 리듬 | 사주에 타오르는 화(火) 기운이 강해 열정과 에너지가 넘치지만, 열감이 위로 몰리거나 조급함으로 수면 리듬이 흔들리기 쉽습니다. 역동적인 활동으로 열기를 시원하게 발산한 뒤 쿨다운하는 루틴이 최적입니다. | 에너지 발산, 쿨다운, 수분 섭취 |
| `WELL_EARTH_DEF` | 토(土) | 부족 (`DEFICIENT`) | 소화기 · 코어 근육 · 생체리듬 | 사주에 중심을 잡아주는 토(土) 기운이 부족해 환경이 바뀌면 소화 리듬이 예민해지거나 체력 코어가 흔들리기 쉽습니다. 코어 근육을 단단히 잡고 일정한 시간에 반복하는 규칙적인 취미가 몸의 중심을 세워줍니다. | 코어 강화, 규칙적 루틴, 손끝 몰입 |
| `WELL_EARTH_EXC` | 토(土) | 과다 (`EXCESSIVE`) | 기초대사 · 순환 정체 · 복부 | 사주에 안정적인 토(土) 기운이 풍부해 지구력이 좋지만, 움직임이 적어지면 에너지가 정체되어 몸이 무거워지기 쉽습니다. 정적인 상태에서 벗어나 전신을 가볍게 순환시키는 리듬감 있는 활동을 곁들여 보세요. | 전신 순환, 가벼운 유산소, 리프레시 |
| `WELL_METAL_DEF` | 금(金) | 부족 (`DEFICIENT`) | 호흡기 · 폐활량 · 지구력 | 사주에 맑게 수렴하는 금(金) 기운이 부족해 환절기 호흡기가 예민해지거나 긴 호흡을 유지하는 지구력이 아쉬울 수 있습니다. 깊고 규칙적인 호흡법과 폐활량을 길러주는 유산소·수중 운동이 신체 밸런스를 탄탄히 채워줍니다. | 폐활량 강화, 복식 호흡, 리듬 유지 |
| `WELL_METAL_EXC` | 금(金) | 과다 (`EXCESSIVE`) | 호흡 긴장 · 피부 건조 · 경직 | 사주에 단단한 금(金) 기운이 강해 집중력과 결단력이 뛰어나지만, 자신도 모르게 호흡이 얕아지고 몸과 생각이 경직되기 쉽습니다. 정해진 틀에서 벗어나 감각을 유연하게 풀어주는 예술·창작이나 수중 활동이 조화를 돕습니다. | 유연한 이완, 감각 표현, 수분 보충 |
| `WELL_WATER_DEF` | 수(水) | 부족 (`DEFICIENT`) | 수분 대사 · 하체 순환 · 휴식 | 사주에 흐르는 수(水) 기운이 부족해 몸이 쉽게 건조해지거나 하체 피로와 갈증을 자주 느낄 수 있습니다. 충분한 수분 섭취와 함께 물의 흐름처럼 전신을 부드럽게 순환시키는 수영·요가나 고요한 몰입 취미가 에너지를 채워줍니다. | 수분 대사, 하체 스트레칭, 깊은 휴식 |
| `WELL_WATER_EXC` | 수(水) | 과다 (`EXCESSIVE`) | 체온 유지 · 부종 · 생각 과잉 | 사주에 깊은 수(水) 기운이 많아 사고력이 깊고 침착하지만, 생각이 너무 많아지거나 몸이 차가워져 무기력해지기 쉽습니다. 머릿속 생각을 잠시 멈추고 몸을 따뜻하게 데워주는 역동적인 운동이나 손으로 직접 만드는 메이커 활동이 활력을 줍니다. | 체온 상승, 야외 활동, 즉각적 실행 |
| `WELL_BALANCED` | 오행 균형 | 균형 (`BALANCED`) | 오장육부 조화 · 전신 밸런스 | 목·화·토·금·수 다섯 기운이 큰 치우침 없이 고르게 분포한 안정적인 신체 에너지를 지녔습니다. 특정 부위의 무리보다 계절과 컨디션에 맞춰 유산소 활동과 정적인 지적·예술적 휴식을 번갈아 즐기면 최상의 컨디션을 유지할 수 있습니다. | 올라운드 밸런스, 교차 루틴, 컨디션 관리 |

### 3.3 [템플릿 그룹 3] 3대 대분류 총평 템플릿 (3종)
| 대분류 코드 | 한글명 | 타이틀 헤드라인 (`headline`) | 대분류 성향 총평 (`description`) |
| :--- | :---: | :--- | :--- |
| `SPORTS` | **운동형** | **역동적인 활력과 추진력의 운동형** | 사주에 뻗어 나가는 목(木)과 타오르는 화(火)의 생동감이 주도적으로 자리 잡고 있습니다. 머리로만 오래 고민하기보다 직접 몸을 움직여 땀을 흘리고, 눈앞의 기록이나 동작을 성취해 나갈 때 스트레스가 가장 빠르게 해소되는 유형입니다. |
| `INTELLECT` | **지능형** | **깊은 통찰과 전략적 사고의 지능형** | 사주에 지혜로운 수(水)와 명석한 금(金)의 응집력이 두드러집니다. 복잡한 규칙이나 새로운 지식 체계를 분석하고, 조용한 몰입 속에서 나만의 논리와 전략을 완성해 나갈 때 가장 큰 지적 쾌감과 에너지 충전을 경험하는 유형입니다. |
| `ART` | **예술형** | **풍부한 감각과 조화로운 표현의 예술형** | 사주에 포용력의 토(土) 기운과 다채로운 오행의 감수성이 조화롭게 어우러져 있습니다. 일상 속 빛·소리·색채·촉감을 남들보다 섬세하게 포착하며, 내면의 감정과 영감을 눈과 손끝의 창작물로 표현할 때 깊은 행복감을 느끼는 유형입니다. |

### 3.4 [템플릿 그룹 4] 12개 소분류 취미 동적 추천 템플릿 (12종)
동일한 취미가 추천되더라도 사용자마다 다른 사주 수치(%)와 오행 근거가 문장에 삽입되도록 **동적 변수(`{{primaryPct}}`, `{{strongestElementKo}}`, `{{weakestElementKo}}`)**를 포함한 템플릿을 사용한다.

| ID | 대분류 | 취미명 | 주/보조 오행 | 한 줄 요약 (`shortCopy`) | 동적 개인화 추천 사유 템플릿 (`reasonTemplate`) | 입문 실행 가이드 (`starterGuide`) |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `SPORTS_01` | 운동형 | **러닝** | 화(火) / 목(木) | 심폐 에너지를 힘차게 발산하며 앞으로 나아가는 추진력의 취미 | 사주 내 화(火)·목(木) 활동 에너지(주 오행 {{primaryPct}}%)가 역동적으로 작용하여, 심박수를 높이고 앞으로 달리는 러닝에서 답답함이 가장 시원하게 해소됩니다. 특히 {{weakestElementKo}} 기운의 순환을 돕는 규칙적인 호흡 리듬이 신체 활력을 빠르게 끌어올려 줍니다. | 러닝화 한 켤레와 20분 인터벌 달리기 앱(런데이 등)으로 오늘 저녁 가볍게 2km부터 시작해 보세요. |
| `SPORTS_02` | 운동형 | **클라이밍** | 목(木) / 토(土) | 위로 뻗어 오르는 상승 기운과 전신 밸런스를 결합한 도전 | 위로 뻗어 오르려는 목(木) 기운({{primaryPct}}%)과 중심을 잡는 토(土) 기운이 만나, 목표 홀드를 향해 한 단계씩 등반하는 클라이밍에서 강렬한 성취감을 느낍니다. 전신 코어와 악력을 고루 사용하여 {{weakestElementKo}} 에너지 밸런스를 잡는 데도 탁월합니다. | 동네 실내 볼더링 암장의 '일일 체험권(기초 강습 + 암벽화 대여 포함)'으로 첫 루트를 완등해 보세요. |
| `SPORTS_03` | 운동형 | **수영** | 수(水) / 금(金) | 물의 유연한 흐름 속에서 호흡과 리듬을 규칙적으로 제어하는 운동 | 유연한 수(水) 기운({{primaryPct}}%)과 규칙적인 호흡의 금(金) 기운이 조화를 이루어, 물의 부력 속에서 전신을 리듬감 있게 움직이는 수영과 궁합이 매우 뛰어납니다. 관절에 무리를 주지 않으면서 {{weakestElementKo}} 기운의 전신 순환과 폐활량을 동시에 길러줍니다. | 인근 시립 체육센터의 초급 강습반에 등록하거나 주말 자유수영 1회권으로 물과 친해져 보세요. |
| `SPORTS_04` | 운동형 | **요가·필라테스** | 목(木) / 수(水) | 근육과 관절을 유연하게 뻗어내며 호흡과 내면의 정렬을 맞추는 수련 | 신체를 유연하게 확장하는 목(木) 기운({{primaryPct}}%)과 내면의 흐름을 다스리는 수(水) 기운이 어우러져, 호흡과 코어 정렬에 집중하는 요가·필라테스에 깊이 몰입할 수 있습니다. 굳어 있는 근육을 이완하고 {{weakestElementKo}} 에너지의 불균형을 바로잡는 데 최적입니다. | 거실에 요가 매트를 펴고 유튜브 15분 모닝 스트레칭·코어 루틴 영상을 따라 하며 호흡을 정돈해 보세요. |
| `INTELLECT_01` | 지능형 | **독서·글쓰기** | 수(水) / 목(木) | 깊은 사유의 바다에서 통찰을 길어 올려 나만의 문장으로 틔우는 취미 | 깊은 사색을 상징하는 수(水) 기운({{primaryPct}}%)을 바탕으로 지식을 흡수하고, 이를 목(木)의 생명력 있는 문장으로 엮어내는 능력이 돋보입니다. 조용히 책을 읽고 생각을 기록하는 시간은 과열된 일상을 식히고 {{weakestElementKo}} 기운을 차분히 보완해 줍니다. | 하루 15쪽 독서와 인상 깊은 문장 3줄 필사·단상 노트를 작성하는 가벼운 루틴부터 시작해 보세요. |
| `INTELLECT_02` | 지능형 | **보드게임·체스** | 금(金) / 수(水) | 명확한 규칙과 수읽기 속에서 냉철한 판단력과 전략을 겨루는 두뇌 게임 | 명쾌한 결단력의 금(金) 기운({{primaryPct}}%)과 치밀한 수읽기의 수(水) 기운이 결합되어, 정해진 규칙 안에서 최선의 수를 찾아내는 체스·전략 보드게임에서 두뇌가 반짝입니다. 잡념을 지우고 고도의 집중력을 발휘하며 {{weakestElementKo}} 에너지까지 정돈할 수 있습니다. | 스마트폰 체스 앱(Chess.com 등)의 '하루 5분 전술 퍼즐 모드'나 1인 전략 보드게임으로 가볍게 입문해 보세요. |
| `INTELLECT_03` | 지능형 | **코딩·메이커** | 금(金) / 화(火) | 정교한 논리 구조를 설계해 실제로 작동하는 결과물을 구현하는 창작 | 구조적 논리를 세우는 금(金) 기운({{primaryPct}}%)과 이를 눈에 보이는 결과물로 구현하는 화(火)의 실행력이 만나, 코딩·메이커 활동에서 높은 몰입도를 보입니다. 내 손으로 문제를 해결하고 자동화 도구를 완성하는 과정이 {{weakestElementKo}} 기운의 활력을 자극합니다. | 웹 브라우저에서 바로 실행되는 파이썬 기초 튜토리얼이나 노코드 업무 자동화 미니 프로젝트 하나를 만들어 보세요. |
| `INTELLECT_04` | 지능형 | **외국어 학습** | 수(水) / 화(火) | 새로운 언어 체계를 흡수하고 세상과 넓게 소통하는 지적 확장 | 유연하게 패턴을 흡수하는 수(水) 기운({{primaryPct}}%)과 외부 세계로 표현을 넓히는 화(火)의 소통 에너지가 조화를 이루어 외국어 학습에 강점이 있습니다. 새로운 언어로 말문이 트이는 자극이 일상의 매너리즘을 깨고 {{weakestElementKo}} 기운에 생기를 불어넣습니다. | 하루 10분 회화 앱(듀오링고 등)과 좋아하는 해외 드라마·유튜브 1문장 쉐도잉으로 부담 없이 시작해 보세요. |
| `ART_01` | 예술형 | **그림·드로잉** | 토(土) / 목(木) | 일상의 풍경과 감정을 종이 위에 선과 색으로 차분히 담아내는 표현 | 대상을 차분히 관찰하고 수용하는 토(土) 기운({{primaryPct}}%)과 생동감 있는 선을 뻗어내는 목(木) 기운이 어우러져 그림·드로잉에 천부적인 감각을 발휘합니다. 손끝으로 선과 색을 채워나가는 무념무상의 시간이 {{weakestElementKo}} 에너지의 피로를 부드럽게 다독여 줍니다. | 펜 하나와 손바닥만 한 크로키북(또는 태블릿)을 준비해 오늘 마신 커피잔이나 창밖 풍경을 5분간 스케치해 보세요. |
| `ART_02` | 예술형 | **악기 연주** | 화(火) / 금(金) | 정교한 음계와 박자 위에서 감정의 울림을 소리로 발산하는 예술 | 정교한 박자와 음계를 짚어내는 금(金)의 감각과 내면의 감정을 소리로 발산하는 화(火) 기운({{primaryPct}}%)이 만나 악기 연주에서 깊은 카타르시스를 얻습니다. 손끝의 진동과 멜로디에 집중하는 과정이 {{weakestElementKo}} 기운의 긴장을 조화롭게 풀어줍니다. | 칼림바·우쿨렐레·미디 키보드 등 집에서도 독학하기 좋은 악기로 가장 좋아하는 노래 1곡 완주에 도전해 보세요. |
| `ART_03` | 예술형 | **사진·영상 촬영** | 금(金) / 토(土) | 찰나의 빛과 구도를 프레임으로 포착해 시간의 기록으로 남기는 작업 | 찰나의 구도와 빛을 예리하게 포착하는 금(金) 기운({{primaryPct}}%)과 일상의 순간을 묵직한 기록으로 남기는 토(土) 기운이 시너지를 내어 사진·영상 촬영에 탁월한 안목을 보입니다. 시선을 바꿔 세상을 관찰하는 산책이 {{weakestElementKo}} 에너지를 자연스럽게 충전해 줍니다. | 스마트폰 카메라의 '격자선(Grid)' 기능을 켜고 동네 산책길의 빛과 그림자를 10장 찍어 무료 보정 앱으로 색감을 입혀보세요. |
| `ART_04` | 예술형 | **도예·공예** | 토(土) / 수(水) | 흙과 재료의 물성을 손끝으로 빚어내며 온전한 몰입을 경험하는 수공예 | 흙과 자연 재료를 뜻하는 토(土) 기운({{primaryPct}}%)과 부드럽게 형태를 빚어내는 수(水)의 유연함이 결합되어 도예·공예에서 깊은 심리적 안정감을 느낍니다. 손끝의 촉각에 온전히 집중하는 시간이 복잡한 생각을 비우고 {{weakestElementKo}} 기운의 균형을 되찾아 줍니다. | 주말 공방 원데이 클래스(나만의 머그컵·트레이 만들기)를 예약하거나 홈 에어드라이 클레이 키트로 소품을 빚어보세요. |

## 4. 만세력 계산 및 판정 엔진 상세 명세 (Scoring Engine Spec)

### 4.1 만세력 라이브러리 후보 비교 및 선정
| 비교 항목 | [manseryeok](https://github.com/yhj1024/manseryeok) (1순위 선정) | [@fullstackfamily/manseryeok](https://github.com/urstory/manseryeok-js) (2순위 대안) | [lunar-javascript](https://github.com/6tail/lunar-javascript) (3순위) |
| :--- | :--- | :--- | :--- |
| **데이터 기준** | 한국천문연구원(KASI) 정본 만세력·24절기 기준 | 한국 음력(1900~2050) 및 24절기·60갑자 내장 | 중국 천문 역법 기준 (절기 시각 미세 차이 존재) |
| **TypeScript 지원** | 네이티브 TypeScript 작성, 완벽한 타입 추론 | 순수 JS/TS 지원, 의존성 없음(Zero-deps) | JS 기반 + `@types` 지원 (한자 키 매핑 별도 필요) |
| **사주팔자 추출** | 양/음력 변환, 사주 4주 8글자, 진태양시 보정 내장 | 양/음력 변환 및 4주(년·월·일·시주) 추출 API 제공 | 팔자·십신·대운 등 방대하나 한자 파싱 레이어 필요 |
| **선정 결론** | **최종 채택 권장**: 한국 표준시(KST)·진태양시 보정 및 TS 친화성이 가장 우수함 | 1순위 패키지 이슈 발생 시 즉시 교체 가능한 어댑터 패턴 적용 | 한국어 오행 매핑 공수가 크므로 후보에서 제외 |

### 4.2 사주 팔자 → 오행 분포(`ElementDistribution`) 산출 알고리즘
사용자의 사주 8글자(천간 4글자 + 지지 4글자, 시간 미입력 시 6글자)에서 목(木)·화(火)·토(土)·금(金)·수(水) 5행의 비율을 추출한다.

1. **천간(天干) 10글자 오행 매핑**:
   - **목(木)**: 갑(甲, `STEM_GAP`), 을(乙, `STEM_EUL`)
   - **화(火)**: 병(丙, `STEM_BYEONG`), 정(丁, `STEM_JEONG`)
   - **토(土)**: 무(戊, `STEM_MU`), 기(己, `STEM_GI`)
   - **금(金)**: 경(庚, `STEM_GYEONG`), 신(辛, `STEM_SIN`)
   - **수(水)**: 임(壬, `STEM_IM`), 계(癸, `STEM_GYE`)
2. **지지(地支) 12글자 본기(本氣) 오행 매핑**:
   - **목(木)**: 인(寅), 묘(卯)
   - **화(火)**: 사(巳), 오(午)
   - **토(土)**: 진(辰), 술(戌), 축(丑), 미(未)
   - **금(金)**: 신(申), 유(酉)
   - **수(水)**: 해(亥), 자(子)
3. **자리별 가중치 부여 (Position Weighting)**:
   - **출생시간 입력 시 (8글자, 총 가중치 합 = `9.0`)**: 년간(`1.0`), 년지(`1.0`), 월간(`1.0`), **월지(`1.5`)**, **일간(`1.5`)**, 일지(`1.0`), 시간(`1.0`), 시지(`1.0`)
   - **출생시간 모름 선택 시 (6글자, 총 가중치 합 = `7.0`)**: 년간(`1.0`), 년지(`1.0`), 월간(`1.0`), **월지(`1.5`)**, **일간(`1.5`)**, 일지(`1.0`)
4. **오행 백분율 정규화 (`0 ~ 100`)**:
   - $$E_e = \text{round}\left(\frac{W_e}{W_{total}} \times 100, 1\right)$$

### 4.3 3대 대분류 점수 산출 공식 (`judgeCategories`)
1. **대분류별 원점수($R$) 산출 수식**:
   - **운동형 원점수 ($R_{sports}$)**:
     $$R_{sports} = 0.55 \times E_{fire} + 0.45 \times E_{wood} + I(\text{일간} \in \{\text{목, 화}\}) \times 5$$
   - **지능형 원점수 ($R_{intellect}$)**:
     $$R_{intellect} = 0.55 \times E_{water} + 0.45 \times E_{metal} + I(\text{일간} \in \{\text{수, 금}\}) \times 5$$
   - **예술형 원점수 ($R_{art}$)**:
     - 오행 표준편차 $\sigma = \sqrt{\frac{1}{5}\sum_{e}(E_e - 20)^2}$
     - 균형 보너스 $B_{balance} = \max(0, 18 - 0.6 \times \sigma)$
     - $$R_{art} = 0.65 \times E_{earth} + B_{balance} + 0.15 \times \min(E_{wood}, E_{fire}) + 0.15 \times \min(E_{metal}, E_{water}) + I(\text{일간} = \text{토}) \times 5$$
2. **백분율 정규화 및 동점 처리 규칙 (Tie-Breaker)**:
   - $S_{total} = R_{sports} + R_{intellect} + R_{art}$, $S_{cat} = \text{round}\left(\frac{R_{cat}}{S_{total}} \times 100, 1\right)$
   - 동점 시: ① 일간(日干) 오행 소속 분류 우선 → ② 월지(月支) 오행 소속 분류 우선 → ③ 고정 우선순위 (`SPORTS` > `INTELLECT` > `ART`)

### 4.4 12개 소분류 취미 점수 산출 및 동적 템플릿 렌더링 (`rankHobbies`)
1. **소분류 취미 $h$ 적합도 점수 $H_h$**:
   $$H_h = \text{round}\left( 0.40 \times S_{C_h} + 0.40 \times E_{P_h} + 0.20 \times E_{Sub_h} + B_{complement}(h), 1 \right)$$
   - 보완 가산점 $B_{complement}(h)$: 주/보조 오행이 일간 오행과 일치 시 `+4점`, 가장 부족한 오행($e_{weak}$)과 일치 시 `+3점`.
2. **동적 변수 치환 규칙 (`interpolateReason`)**:
   - 각 취미의 `reasonTemplate` 내 플레이스홀더를 실제 사용자의 오행 계산 결과로 치환한다:
     - `{{primaryPct}}` → 해당 취미의 주 오행($P_h$)이 사용자 사주에서 차지하는 비율 $E_{P_h}$ (예: `38.9`)
     - `{{strongestElementKo}}` → 사용자의 최강 오행 한글명 (예: `화(火)`)
     - `{{weakestElementKo}}` → 사용자의 최약(보완 필요) 오행 한글명 (예: `수(水)`)

### 4.5 핵심 판정 엔진 TypeScript 인터페이스 명세 (`src/types/saju.ts`)
```typescript
export type ElementType = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type CategoryType = 'SPORTS' | 'INTELLECT' | 'ART';
export type CalendarType = 'solar' | 'lunar' | 'leap';
export type GenderType = 'M' | 'F';
export type StemCode =
  | 'STEM_GAP' | 'STEM_EUL' | 'STEM_BYEONG' | 'STEM_JEONG' | 'STEM_MU'
  | 'STEM_GI' | 'STEM_GYEONG' | 'STEM_SIN' | 'STEM_IM' | 'STEM_GYE';
export type WellnessState = 'DEFICIENT' | 'EXCESSIVE' | 'BALANCED';

export interface BirthInput {
  birthDate: string;          // 'YYYY-MM-DD'
  birthTime: string | null;   // 'HH:mm' 또는 null (시간 모름)
  calendarType: CalendarType;
  gender: GenderType;
}

export interface DayMasterProfile {
  stemCode: StemCode;
  nameKo: string;             // 예: '병화(丙火)'
  element: ElementType;
  nickname: string;           // 예: '세상을 비추는 한여름의 태양'
  summary: string;            // 10천간 캐릭터 성향 요약
}

export interface WellnessGuide {
  templateId: string;         // 예: 'WELL_WATER_DEF' 또는 'WELL_BALANCED'
  state: WellnessState;
  targetElement: ElementType | 'all';
  bodyAxis: string;           // 예: '수분 대사 · 하체 순환 · 휴식'
  content: string;            // 오행 건강/신체 에너지 해설 본문
  careKeywords: string[];     // 예: ['수분 대사', '하체 스트레칭', '깊은 휴식']
}

export interface CategorySummary {
  category: CategoryType;
  nameKo: string;
  headline: string;
  description: string;
  score: number;
}

export interface HobbyScoreItem {
  hobbyId: string;
  name: string;
  category: CategoryType;
  primaryElement: ElementType;
  secondaryElement: ElementType;
  score: number;
  rank: number;               // 1 ~ 12위
  shortCopy: string;
  matchReason: string;        // 수치(%) 치환이 완료된 개인화 추천 사유
  starterGuide: string;
}

export interface JudgeResult {
  saju: SajuData;
  dayMaster: DayMasterProfile;      // 10천간 캐릭터 정보
  elements: Record<ElementType, number>;
  strongestElement: ElementType;
  weakestElement: ElementType;
  isBalanced: boolean;              // max(E) - min(E) <= 15 여부
  wellness: {
    primary: WellnessGuide;         // 대표 신체 에너지/웰니스 가이드
    secondary?: WellnessGuide;      // 특정 오행 과다(>=35%) 시 추가 발산 가이드
  };
  categoryScores: Record<CategoryType, number>;
  topCategory: CategorySummary;     // 1순위 대분류 및 총평
  topHobby: HobbyScoreItem;         // 1순위 대표 추천 취미
  allHobbies: HobbyScoreItem[];     // 12개 전체 순위
}
```

## 5. 회원 / 비회원 권한 경계 및 결과 이월(Migration) 상세 설계

### 5.1 기능별 접근 권한 매트릭스
| 기능 항목 | 비회원 (Guest) | 로그인 회원 (Member) | UI/UX 처리 방식 |
| :--- | :---: | :---: | :--- |
| **생년월일시 입력 및 사주 팔자 계산** | ✅ | ✅ | 회원은 저장된 프로필(`profiles`) 원클릭 불러오기 지원 |
| **10천간 나만의 캐릭터 카드** | ✅ | ✅ | 캐릭터 별칭 및 기질 요약 전체 공개 |
| **오행 분포 차트 & 신체 웰니스 가이드** | ✅ | ✅ | 오행 비율 바 및 11종 웰니스 케어 가이드 공개 |
| **3대 대분류 점수 및 1순위 총평** | ✅ | ✅ | 운동형·지능형·예술형 점수 비율 및 1위 분류 총평 표시 |
| **대표 추천 취미 1개 상세 카드** | ✅ | ✅ | 1위 취미명, 동적 수치(`%`) 매칭 이유, 입문 가이드 표시 |
| **12개 소분류 전체 점수 및 순위표 (2~12위)** | ❌ (블러 잠금) | ✅ (전체 해금) | 비회원 화면에서는 2~4위 카드가 블러 처리되며 로그인 CTA 오버레이 노출 |
| **판정 결과 영구 저장 및 재조회** | ❌ (새로고침 시 소실) | ✅ (`/saju/mypage` 이력 보관) | 비회원 상단에 "현재 결과는 저장되지 않았습니다" 배너 노출 |
| **결과 공유 링크 (`/saju/share/[id]`) 생성** | ❌ | ✅ | 공유 버튼 클릭 시 비회원은 로그인 모달 호출, 회원은 클립보드 링크 복사 |

### 5.2 비회원 판정 결과 자동 이월(Pending Result Handover) 메커니즘
1. **임시 보관 (`localStorage`)**: 비회원이 `/saju/input` 제출 시 입력값과 `JudgeResult` 전체를 `localStorage.setItem('saju_pending_result', ...)`에 저장 (만료 24시간).
2. **소셜 로그인 트리거**: `/saju/result`에서 `[로그인하고 12개 전체 순위 확인·저장하기]` 클릭 시 `redirectTo: '${origin}/saju/auth/callback?next=/saju/result/migrate'`로 OAuth 호출.
3. **자동 DB 적재 (`/saju/result/migrate`)**: 로그인 완료 후 `saju_pending_result`를 읽어 `profiles` upsert 및 `results` insert 수행 후 `localStorage` 클린업 및 `/saju/result/[id]`로 리다이렉트.

## 6. 페이지 구조(IA) 및 화면별 상세 기능 명세

### 6.1 라우트 맵 (Next.js App Router)
| 경로 (Route) | 렌더링 방식 | 접근 권한 | 핵심 역할 |
| :--- | :--- | :--- | :--- |
| `/` | SSR / Static | 전체 공개 | 서비스 소개, 10천간 캐릭터·3분류·12취미 프리뷰, `[내 사주 취미 찾기]` CTA |
| `/saju/input` | CSR | 전체 공개 | 생년월일시·달력유형·성별 입력 폼, 실시간 유효성 검증, 회원 프로필 자동 채우기 |
| `/saju/result` | CSR | 전체 공개 | 비회원 임시 판정 결과 뷰 (`localStorage` 기반), 1위 취미·웰니스 공개 및 2~12위 블러 |
| `/saju/result/migrate` | CSR | 회원 전용 | OAuth 로그인 직후 비회원 임시 결과를 Supabase DB에 자동 저장 후 리다이렉트 |
| `/saju/result/[id]` | SSR + CSR | 본인 회원 전용 | DB에 저장된 회원 판정 결과 상세 뷰 (1~12위 전체 순위 해금, 공유 링크 복사) |
| `/saju/share/[id]` | SSR (Dynamic OG) | 전체 공개 (`is_public=true`) | 타인에게 공유된 결과 전용 뷰 (생년월일시 비노출, 일간 캐릭터·웰니스·취미 요약) |
| `/saju/login` | CSR | 비회원 전용 | 이메일·Google·카카오 로그인 및 개인정보 수집·이용 동의 체크박스 제공 |
| `/saju/auth/callback` | Route Handler | 시스템 | Supabase OAuth 인증 코드 교환(`exchangeCodeForSession`) 라우트 |
| `/saju/mypage` | SSR + CSR | 회원 전용 | 내 기본 생년월일시 프로필 수정, 과거 판정 결과 히스토리 목록 조회·삭제 |

## 7. 데이터베이스 스키마(DDL) 및 36종 템플릿 실제 데이터(Seed SQL)

Supabase SQL Editor에 그대로 복사하여 실행하면 **사용자/결과 테이블 + 36종 마스터 템플릿 테이블 + RLS 보안 정책 + 36개 실제 데이터 적재**가 한 번에 완료되는 전체 스크립트이다.

### 7.1 테이블 스키마 및 RLS 보안 정책 (DDL)
```sql
-- UUID 생성 확장 활성화
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. 마스터 템플릿 테이블 (총 36종 콘텐츠 저장소)
-- ============================================================================

-- [1-1] 10천간(일간) 나만의 캐릭터 템플릿 테이블 (10종)
CREATE TABLE public.saju_day_masters (
  stem_code TEXT PRIMARY KEY,              -- 예: 'STEM_GAP'
  stem_ko TEXT NOT NULL,                   -- 예: '갑목'
  stem_hanja TEXT NOT NULL,                -- 예: '甲木'
  element TEXT NOT NULL CHECK (element IN ('wood', 'fire', 'earth', 'metal', 'water')),
  yin_yang TEXT NOT NULL CHECK (yin_yang IN ('yang', 'yin')),
  nickname TEXT NOT NULL,                  -- 캐릭터 별칭
  summary TEXT NOT NULL                    -- 성향 상세 해설
);

-- [1-2] 오행 건강/신체 에너지 웰니스 템플릿 테이블 (11종: 과다 5 + 부족 5 + 균형 1)
CREATE TABLE public.saju_wellness_templates (
  template_id TEXT PRIMARY KEY,            -- 예: 'WELL_WOOD_DEF', 'WELL_BALANCED'
  element TEXT NOT NULL CHECK (element IN ('wood', 'fire', 'earth', 'metal', 'water', 'all')),
  state TEXT NOT NULL CHECK (state IN ('DEFICIENT', 'EXCESSIVE', 'BALANCED')),
  body_axis TEXT NOT NULL,                 -- 연관 신체 에너지 축
  content TEXT NOT NULL,                   -- 웰니스 & 신체 밸런스 해설 문구
  care_keywords TEXT[] NOT NULL            -- 추천 케어 키워드 배열
);

-- [1-3] 3대 대분류 총평 템플릿 테이블 (3종)
CREATE TABLE public.saju_category_templates (
  category_code TEXT PRIMARY KEY CHECK (category_code IN ('SPORTS', 'INTELLECT', 'ART')),
  name_ko TEXT NOT NULL,                   -- '운동형' | '지능형' | '예술형'
  core_elements TEXT NOT NULL,             -- 핵심 오행 축 설명
  headline TEXT NOT NULL,                  -- 결과 화면 타이틀 헤드라인
  description TEXT NOT NULL                -- 대분류 총평 본문
);

-- [1-4] 12개 소분류 취미 마스터 및 동적 추천 템플릿 테이블 (12종)
CREATE TABLE public.saju_hobby_templates (
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
-- 2. 사용자 프로필 및 판정 결과 테이블
-- ============================================================================

-- [2-1] 회원 프로필 테이블
CREATE TABLE public.profiles (
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
CREATE TABLE public.results (
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

CREATE INDEX idx_results_user_id_created_at ON public.results (user_id, created_at DESC);

-- ============================================================================
-- 3. Row Level Security (RLS) 정책 및 공유 안전 뷰(View)
-- ============================================================================

ALTER TABLE public.saju_day_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saju_wellness_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saju_category_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saju_hobby_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- 마스터 템플릿 4개 테이블은 비회원(anon) 및 회원(authenticated) 모두 읽기(SELECT) 허용
CREATE POLICY "master_day_masters_read_all" ON public.saju_day_masters FOR SELECT USING (true);
CREATE POLICY "master_wellness_read_all" ON public.saju_wellness_templates FOR SELECT USING (true);
CREATE POLICY "master_categories_read_all" ON public.saju_category_templates FOR SELECT USING (true);
CREATE POLICY "master_hobbies_read_all" ON public.saju_hobby_templates FOR SELECT USING (true);

-- profiles: 본인(auth.uid() = user_id)만 접근 가능
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- results: 본인(auth.uid() = user_id)만 원본 행 CRUD 가능
CREATE POLICY "results_all_own" ON public.results FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 공유 전용 뷰: 생년월일시(birth_date, birth_time) 원본을 제외하고 캐릭터·웰니스·취미 결과만 공개
CREATE OR REPLACE VIEW public.shared_results_view AS
SELECT
  r.id,
  r.saju_palja,
  r.scores,
  r.top_category,
  r.top_hobby_id,
  r.stem_code,
  dm.nickname AS day_master_nickname,
  dm.summary AS day_master_summary,
  r.wellness_template_id,
  wt.body_axis AS wellness_body_axis,
  wt.content AS wellness_content,
  r.created_at
FROM public.results r
JOIN public.saju_day_masters dm ON r.stem_code = dm.stem_code
JOIN public.saju_wellness_templates wt ON r.wellness_template_id = wt.template_id
WHERE r.is_public = true;

GRANT SELECT ON public.shared_results_view TO anon, authenticated;
```

### 7.2 36종 마스터 템플릿 실제 데이터 적재 (Seed SQL)
```sql
-- ============================================================================
-- [SEED 1] 10천간(일간) 캐릭터 데이터 (10건)
-- ============================================================================
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

-- ============================================================================
-- [SEED 2] 오행 건강/신체 에너지 웰니스 템플릿 데이터 (11건: 부족 5 + 과다 5 + 균형 1)
-- ============================================================================
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

-- ============================================================================
-- [SEED 3] 3대 대분류 총평 템플릿 데이터 (3건)
-- ============================================================================
INSERT INTO public.saju_category_templates (category_code, name_ko, core_elements, headline, description) VALUES
('SPORTS', '운동형', '화(火) · 목(木) 중심', '역동적인 활력과 추진력의 운동형', '사주에 뻗어 나가는 목(木)과 타오르는 화(火)의 생동감이 주도적으로 자리 잡고 있습니다. 머리로만 오래 고민하기보다 직접 몸을 움직여 땀을 흘리고, 눈앞의 기록이나 동작을 성취해 나갈 때 스트레스가 가장 빠르게 해소되는 유형입니다.'),
('INTELLECT', '지능형', '수(水) · 금(金) 중심', '깊은 통찰과 전략적 사고의 지능형', '사주에 지혜로운 수(水)와 명석한 금(金)의 응집력이 두드러집니다. 복잡한 규칙이나 새로운 지식 체계를 분석하고, 조용한 몰입 속에서 나만의 논리와 전략을 완성해 나갈 때 가장 큰 지적 쾌감과 에너지 충전을 경험하는 유형입니다.'),
('ART', '예술형', '토(土) + 오행 균형/혼합', '풍부한 감각과 조화로운 표현의 예술형', '사주에 포용력의 토(土) 기운과 다채로운 오행의 감수성이 조화롭게 어우러져 있습니다. 일상 속 빛·소리·색채·촉감을 남들보다 섬세하게 포착하며, 내면의 감정과 영감을 눈과 손끝의 창작물로 표현할 때 깊은 행복감을 느끼는 유형입니다.')
ON CONFLICT (category_code) DO UPDATE SET
  headline = EXCLUDED.headline,
  description = EXCLUDED.description;

-- ============================================================================
-- [SEED 4] 12개 소분류 취미 마스터 및 동적 추천 사유 템플릿 데이터 (12건)
-- ============================================================================
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
```

## 8. 프론트엔드 상수 파일 및 동적 조립 유틸리티 명세 (`src/constants/templates.ts`)

DB 네트워크 호출 없이도 클라이언트/서버 순수 함수(`judge(saju)`)가 즉시 0.01초 만에 결과를 조합할 수 있도록 동일한 36종 데이터를 TypeScript 상수 및 치환 헬퍼로 함께 제공한다.

```typescript
import { ElementType } from '@/types/saju';

export const ELEMENT_KO_LABEL: Record<ElementType, string> = {
  wood: '목(木)',
  fire: '화(火)',
  earth: '토(土)',
  metal: '금(金)',
  water: '수(水)',
};

/**
 * 취미 추천 사유 템플릿 내 {{primaryPct}}, {{strongestElementKo}}, {{weakestElementKo}} 치환 순수 함수
 */
export function interpolateHobbyReason(
  reasonTemplate: string,
  params: {
    primaryPct: number;
    strongestElement: ElementType;
    weakestElement: ElementType;
  }
): string {
  return reasonTemplate
    .replace(/\{\{primaryPct\}\}/g, params.primaryPct.toFixed(1))
    .replace(/\{\{strongestElementKo\}\}/g, ELEMENT_KO_LABEL[params.strongestElement])
    .replace(/\{\{weakestElementKo\}\}/g, ELEMENT_KO_LABEL[params.weakestElement]);
}

/**
 * 오행 분포에서 대표 웰니스 템플릿 ID를 결정하는 순수 함수
 * - 최고-최저 오행 비율 차이가 15%p 이하이면 'WELL_BALANCED' 반환
 * - 그 외에는 가장 부족한 오행의 DEFICIENT 템플릿 반환 (최고 오행 >= 35% 시 EXCESSIVE 보조 반환)
 */
export function resolveWellnessTemplateIds(
  elements: Record<ElementType, number>,
  strongest: ElementType,
  weakest: ElementType
): { primaryId: string; secondaryId?: string; isBalanced: boolean } {
  const maxVal = elements[strongest];
  const minVal = elements[weakest];

  if (maxVal - minVal <= 15) {
    return { primaryId: 'WELL_BALANCED', isBalanced: true };
  }

  const codeMap: Record<ElementType, string> = {
    wood: 'WOOD',
    fire: 'FIRE',
    earth: 'EARTH',
    metal: 'METAL',
    water: 'WATER',
  };

  const primaryId = `WELL_${codeMap[weakest]}_DEF`;
  const secondaryId = maxVal >= 35 ? `WELL_${codeMap[strongest]}_EXC` : undefined;

  return { primaryId, secondaryId, isBalanced: false };
}
```

## 9. 테스트 전략 및 품질 검증 (Vitest)

판정 로직이 UI와 완전히 분리된 순수 함수(`judge(saju)`)로 작성되므로, `tests/judge.test.ts`에 다음 8가지 핵심 단위 테스트 스위트를 필수로 구축한다.

| 테스트 케이스 ID | 검증 항목 | 입력 조건 요약 | 기대 결과 (Assertion) |
| :--- | :--- | :--- | :--- |
| `TC-JUDGE-01` | **결정론(Determinism) 검증** | 동일한 `SajuData`로 `judge(saju)`를 100회 반복 호출 | 100회 모두 `categoryScores`, `topCategory`, `wellness`, `allHobbies`가 100% 일치 |
| `TC-JUDGE-02` | **운동형(`SPORTS`) 1위 판정** | 화(火)·목(木) 비중 합계가 70% 이상인 사주 원국 입력 | `topCategory.category === 'SPORTS'` 이며 `topHobby.category === 'SPORTS'` |
| `TC-JUDGE-03` | **지능형(`INTELLECT`) 1위 판정** | 수(水)·금(金) 비중 합계가 70% 이상인 사주 원국 입력 | `topCategory.category === 'INTELLECT'` 이며 `topHobby.category === 'INTELLECT'` |
| `TC-JUDGE-04` | **예술형(`ART`) 1위 판정** | 토(土) 비중이 높거나 5행이 각 20%씩 균형인 원국 입력 | 균형 보너스($B_{balance}$) 작동으로 `topCategory.category === 'ART'` 판정 |
| `TC-JUDGE-05` | **동점 시 일간(日干) 우선 규칙** | 운동형 원점수와 지능형 원점수가 동일한 상태에서 일간이 `임수(壬水)`인 경우 | 일간 오행(수 → 지능형) 규칙에 의해 `topCategory.category === 'INTELLECT'` 반환 |
| `TC-JUDGE-06` | **출생시간 모름(6글자) 정규화** | `hour: null` 인 삼주(6글자) 데이터 입력 | 에러 없이 오행 총합이 `100%`(`±0.1`)로 정규화되며 12개 취미 점수가 정상 산출됨 |
| `TC-JUDGE-07` | **오행 균형형(`WELL_BALANCED`) 분기** | 5행 비율이 `22 / 21 / 20 / 19 / 18` ($\max - \min = 4 \le 15$)인 입력 | 억지 결핍 진단 없이 `wellness.primary.templateId === 'WELL_BALANCED'` 반환 |
| `TC-JUDGE-08` | **취미 추천 사유 동적 수치 치환** | 화(火) 비율이 `38.9%`, 최약 오행이 `수(水)`인 입력 | `topHobby.matchReason` 문자열 내에 `'38.9%'`와 `'수(水)'`가 정상 치환되어 플레이스홀더(`{{`)가 남아있지 않음 |

## 10. 단계별 구현 마일스톤 (Implementation Roadmap)

1. **Milestone 1 — 코어 엔진, 36종 템플릿 상수 및 단위 테스트 구축 (Day 1)**
   - Next.js + TypeScript + Tailwind CSS + Vitest 프로젝트 초기화
   - `src/constants/templates.ts`에 36종 마스터 템플릿(10천간·11웰니스·3대분류·12취미) 및 `interpolateHobbyReason` 구현
   - `src/lib/saju/calculator.ts` 및 `src/lib/saju/judge.ts` 구현 후 Vitest 8대 단위 테스트 통과
2. **Milestone 2 — 입력·결과 UI 및 비회원 플로우 구현 (Day 2)**
   - 랜딩(`/saju`), 생년월일시 입력 폼(`/saju/input`), 비회원 결과 화면(`/saju/result`: 일간 캐릭터 카드 + 오행 웰니스 박스 + 대표 취미 1개 + 2~12위 블러 잠금) 구현
   - `localStorage` 기반 `saju_pending_result` 임시 상태 관리 연동
3. **Milestone 3 — Supabase DB 스키마·36종 Seed 적재 및 자동 이월 연동 (Day 3)**
   - 7장의 DDL 및 36종 Seed SQL 실행 (`saju_day_masters`, `saju_wellness_templates`, `saju_category_templates`, `saju_hobby_templates`, `profiles`, `results`, `shared_results_view`)
   - 카카오·구글 소셜 로그인 연동 및 `/saju/result/migrate` 자동 DB 저장 파이프라인 완성
4. **Milestone 4 — 마이페이지·공유 페이지 및 Vercel 배포 (Day 4)**
   - `/saju/mypage` 이력 조회·삭제, `/saju/share/[id]` 동적 OG 메타데이터(일간 캐릭터 별칭 + 추천 취미 노출) 구현
   - 모바일/데스크톱 반응형 QA 및 Vercel 프로덕션 배포 검증
