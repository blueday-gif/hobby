import type {
  CategoryType,
  DayMasterProfile,
  ElementType,
  StemCode,
  WellnessGuide,
} from "./types";

export const ELEMENT_KO_LABEL: Record<ElementType, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
};

export const ELEMENT_SHORT_KO: Record<ElementType, string> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

// ─────────────────────────────────────────────────────────────
// [템플릿 그룹 1] 10천간(일간) 캐릭터 (10종)
// ─────────────────────────────────────────────────────────────
export interface DayMasterTemplate extends DayMasterProfile {
  stemKo: string; // 한글 한 글자 (갑, 을, ...)
  hanja: string; // 甲木
  yinYang: "yang" | "yin";
}

export const DAY_MASTER_TEMPLATES: Record<StemCode, DayMasterTemplate> = {
  STEM_GAP: {
    stemCode: "STEM_GAP", stemKo: "갑", nameKo: "갑목(甲木)", hanja: "甲木", element: "wood", yinYang: "yang",
    nickname: "우뚝 솟은 푸른 거목",
    summary: "곧은 추진력과 리더십으로 새로운 시작을 두려워하지 않으며, 목표를 향해 위로 뻗어 나가는 성장형 에너지입니다.",
  },
  STEM_EUL: {
    stemCode: "STEM_EUL", stemKo: "을", nameKo: "을목(乙木)", hanja: "乙木", element: "wood", yinYang: "yin",
    nickname: "바람에 흔들리지 않는 들꽃",
    summary: "뛰어난 적응력과 유연한 회복탄력성을 지녔으며, 어떤 환경에서도 끈기 있게 자신만의 영역을 넓혀가는 외유내강형입니다.",
  },
  STEM_BYEONG: {
    stemCode: "STEM_BYEONG", stemKo: "병", nameKo: "병화(丙火)", hanja: "丙火", element: "fire", yinYang: "yang",
    nickname: "세상을 비추는 한여름의 태양",
    summary: "숨김없이 밝고 정열적인 에너지를 발산하며, 주변에 활기를 불어넣고 즉각적인 행동으로 성취를 만드는 활동가입니다.",
  },
  STEM_JEONG: {
    stemCode: "STEM_JEONG", stemKo: "정", nameKo: "정화(丁火)", hanja: "丁火", element: "fire", yinYang: "yin",
    nickname: "밤하늘을 밝히는 따뜻한 모닥불",
    summary: "은은하지만 꺼지지 않는 깊은 열정과 집중력을 품고 있으며, 섬세한 감수성과 몰입으로 디테일을 완성하는 장인형입니다.",
  },
  STEM_MU: {
    stemCode: "STEM_MU", stemKo: "무", nameKo: "무토(戊土)", hanja: "戊土", element: "earth", yinYang: "yang",
    nickname: "묵묵히 자리를 지키는 넓은 대지",
    summary: "흔들림 없는 포용력과 듬직한 안정감을 지녔으며, 다양한 경험과 감각을 자기만의 중심 속에 단단히 쌓아 올리는 유형입니다.",
  },
  STEM_GI: {
    stemCode: "STEM_GI", stemKo: "기", nameKo: "기토(己土)", hanja: "己土", element: "earth", yinYang: "yin",
    nickname: "생명을 길러내는 비옥한 정원",
    summary: "실용적이고 세심한 감각으로 일상을 가꾸며, 손끝의 정성과 꾸준한 루틴을 통해 구체적인 결과물을 빚어내는 실속형입니다.",
  },
  STEM_GYEONG: {
    stemCode: "STEM_GYEONG", stemKo: "경", nameKo: "경금(庚金)", hanja: "庚金", element: "metal", yinYang: "yang",
    nickname: "단단하게 벼려진 강철 원석",
    summary: "명확한 원칙과 과감한 결단력을 지녔으며, 복잡한 문제를 명쾌하게 정리하고 핵심을 돌파하는 승부사적 기질이 강합니다.",
  },
  STEM_SIN: {
    stemCode: "STEM_SIN", stemKo: "신", nameKo: "신금(辛金)", hanja: "辛金", element: "metal", yinYang: "yin",
    nickname: "정교하게 세공된 빛나는 보석",
    summary: "예리한 안목과 치밀한 분석력을 갖추었으며, 완성도 높은 기준과 미적 감각으로 정교한 결과물을 추구하는 완벽주의형입니다.",
  },
  STEM_IM: {
    stemCode: "STEM_IM", stemKo: "임", nameKo: "임수(壬水)", hanja: "壬水", element: "water", yinYang: "yang",
    nickname: "막힘없이 흐르는 깊고 넓은 바다",
    summary: "풍부한 상상력과 유연한 사고방식으로 큰 그림을 그리며, 새로운 지식과 변화를 스펀지처럼 흡수하는 지혜로운 탐구자입니다.",
  },
  STEM_GYE: {
    stemCode: "STEM_GYE", stemKo: "계", nameKo: "계수(癸水)", hanja: "癸水", element: "water", yinYang: "yin",
    nickname: "대지를 적시는 맑고 촉촉한 봄비",
    summary: "깊은 통찰력과 섬세한 공감 능력을 지녔으며, 조용한 사색과 지적 몰입 속에서 남들이 보지 못하는 영감을 길어 올리는 사색가입니다.",
  },
};

export const STEM_KO_TO_CODE: Record<string, StemCode> = Object.fromEntries(
  Object.values(DAY_MASTER_TEMPLATES).map((t) => [t.stemKo, t.stemCode]),
) as Record<string, StemCode>;

// ─────────────────────────────────────────────────────────────
// [템플릿 그룹 2] 오행 웰니스 (11종: 부족 5 · 과다 5 · 균형 1)
// ─────────────────────────────────────────────────────────────
export const WELLNESS_TEMPLATES: Record<string, WellnessGuide> = {
  WELL_WOOD_DEF: {
    templateId: "WELL_WOOD_DEF", state: "DEFICIENT", targetElement: "wood",
    bodyAxis: "근육 · 관절 · 간 피로도",
    content: "사주에 뻗어 나가는 목(木) 기운이 다소 부족해 피로가 쌓이면 목·어깨 근육과 관절이 쉽게 굳을 수 있습니다. 굳은 몸을 부드럽게 늘려주는 스트레칭과 유연성 운동으로 시작해 활력을 깨워보세요.",
    careKeywords: ["스트레칭", "관절 이완", "산책"],
  },
  WELL_WOOD_EXC: {
    templateId: "WELL_WOOD_EXC", state: "EXCESSIVE", targetElement: "wood",
    bodyAxis: "자율신경 · 긴장도 · 근육",
    content: "사주에 목(木) 기운이 넘쳐 의욕과 추진력이 강하지만, 그만큼 신경계가 쉽게 긴장하고 오버페이스로 피로가 누적되기 쉽습니다. 호흡을 길게 뱉으며 몸의 긴장을 내려놓는 이완 루틴이 꼭 필요합니다.",
    careKeywords: ["호흡 조절", "긴장 이완", "페이스 조절"],
  },
  WELL_FIRE_DEF: {
    templateId: "WELL_FIRE_DEF", state: "DEFICIENT", targetElement: "fire",
    bodyAxis: "심폐 활력 · 혈액순환 · 체온",
    content: "사주에 에너지를 데워주는 화(火) 기운이 부족해 손발이 차거나 기초 활력이 쉽게 떨어질 수 있습니다. 심장 박동을 기분 좋게 높이고 땀을 살짝 내어 혈액순환을 깨우는 유산소 액티비티가 큰 도움이 됩니다.",
    careKeywords: ["심폐 자극", "유산소", "워밍업"],
  },
  WELL_FIRE_EXC: {
    templateId: "WELL_FIRE_EXC", state: "EXCESSIVE", targetElement: "fire",
    bodyAxis: "상열감 · 심박 · 수면 리듬",
    content: "사주에 타오르는 화(火) 기운이 강해 열정과 에너지가 넘치지만, 열감이 위로 몰리거나 조급함으로 수면 리듬이 흔들리기 쉽습니다. 역동적인 활동으로 열기를 시원하게 발산한 뒤 쿨다운하는 루틴이 최적입니다.",
    careKeywords: ["에너지 발산", "쿨다운", "수분 섭취"],
  },
  WELL_EARTH_DEF: {
    templateId: "WELL_EARTH_DEF", state: "DEFICIENT", targetElement: "earth",
    bodyAxis: "소화기 · 코어 근육 · 생체리듬",
    content: "사주에 중심을 잡아주는 토(土) 기운이 부족해 환경이 바뀌면 소화 리듬이 예민해지거나 체력 코어가 흔들리기 쉽습니다. 코어 근육을 단단히 잡고 일정한 시간에 반복하는 규칙적인 취미가 몸의 중심을 세워줍니다.",
    careKeywords: ["코어 강화", "규칙적 루틴", "손끝 몰입"],
  },
  WELL_EARTH_EXC: {
    templateId: "WELL_EARTH_EXC", state: "EXCESSIVE", targetElement: "earth",
    bodyAxis: "기초대사 · 순환 정체 · 복부",
    content: "사주에 안정적인 토(土) 기운이 풍부해 지구력이 좋지만, 움직임이 적어지면 에너지가 정체되어 몸이 무거워지기 쉽습니다. 정적인 상태에서 벗어나 전신을 가볍게 순환시키는 리듬감 있는 활동을 곁들여 보세요.",
    careKeywords: ["전신 순환", "가벼운 유산소", "리프레시"],
  },
  WELL_METAL_DEF: {
    templateId: "WELL_METAL_DEF", state: "DEFICIENT", targetElement: "metal",
    bodyAxis: "호흡기 · 폐활량 · 지구력",
    content: "사주에 맑게 수렴하는 금(金) 기운이 부족해 환절기 호흡기가 예민해지거나 긴 호흡을 유지하는 지구력이 아쉬울 수 있습니다. 깊고 규칙적인 호흡법과 폐활량을 길러주는 유산소·수중 운동이 신체 밸런스를 탄탄히 채워줍니다.",
    careKeywords: ["폐활량 강화", "복식 호흡", "리듬 유지"],
  },
  WELL_METAL_EXC: {
    templateId: "WELL_METAL_EXC", state: "EXCESSIVE", targetElement: "metal",
    bodyAxis: "호흡 긴장 · 피부 건조 · 경직",
    content: "사주에 단단한 금(金) 기운이 강해 집중력과 결단력이 뛰어나지만, 자신도 모르게 호흡이 얕아지고 몸과 생각이 경직되기 쉽습니다. 정해진 틀에서 벗어나 감각을 유연하게 풀어주는 예술·창작이나 수중 활동이 조화를 돕습니다.",
    careKeywords: ["유연한 이완", "감각 표현", "수분 보충"],
  },
  WELL_WATER_DEF: {
    templateId: "WELL_WATER_DEF", state: "DEFICIENT", targetElement: "water",
    bodyAxis: "수분 대사 · 하체 순환 · 휴식",
    content: "사주에 흐르는 수(水) 기운이 부족해 몸이 쉽게 건조해지거나 하체 피로와 갈증을 자주 느낄 수 있습니다. 충분한 수분 섭취와 함께 물의 흐름처럼 전신을 부드럽게 순환시키는 수영·요가나 고요한 몰입 취미가 에너지를 채워줍니다.",
    careKeywords: ["수분 대사", "하체 스트레칭", "깊은 휴식"],
  },
  WELL_WATER_EXC: {
    templateId: "WELL_WATER_EXC", state: "EXCESSIVE", targetElement: "water",
    bodyAxis: "체온 유지 · 부종 · 생각 과잉",
    content: "사주에 깊은 수(水) 기운이 많아 사고력이 깊고 침착하지만, 생각이 너무 많아지거나 몸이 차가워져 무기력해지기 쉽습니다. 머릿속 생각을 잠시 멈추고 몸을 따뜻하게 데워주는 역동적인 운동이나 손으로 직접 만드는 메이커 활동이 활력을 줍니다.",
    careKeywords: ["체온 상승", "야외 활동", "즉각적 실행"],
  },
  WELL_BALANCED: {
    templateId: "WELL_BALANCED", state: "BALANCED", targetElement: "all",
    bodyAxis: "오장육부 조화 · 전신 밸런스",
    content: "목·화·토·금·수 다섯 기운이 큰 치우침 없이 고르게 분포한 안정적인 신체 에너지를 지녔습니다. 특정 부위의 무리보다 계절과 컨디션에 맞춰 유산소 활동과 정적인 지적·예술적 휴식을 번갈아 즐기면 최상의 컨디션을 유지할 수 있습니다.",
    careKeywords: ["올라운드 밸런스", "교차 루틴", "컨디션 관리"],
  },
};

// ─────────────────────────────────────────────────────────────
// [템플릿 그룹 3] 3대 대분류 총평 (3종)
// ─────────────────────────────────────────────────────────────
export interface CategoryTemplate {
  category: CategoryType;
  nameKo: string;
  coreElements: string;
  headline: string;
  description: string;
}

export const CATEGORY_TEMPLATES: Record<CategoryType, CategoryTemplate> = {
  SPORTS: {
    category: "SPORTS", nameKo: "운동형", coreElements: "화(火) · 목(木) 중심",
    headline: "역동적인 활력과 추진력의 운동형",
    description: "사주에 뻗어 나가는 목(木)과 타오르는 화(火)의 생동감이 주도적으로 자리 잡고 있습니다. 머리로만 오래 고민하기보다 직접 몸을 움직여 땀을 흘리고, 눈앞의 기록이나 동작을 성취해 나갈 때 스트레스가 가장 빠르게 해소되는 유형입니다.",
  },
  INTELLECT: {
    category: "INTELLECT", nameKo: "지능형", coreElements: "수(水) · 금(金) 중심",
    headline: "깊은 통찰과 전략적 사고의 지능형",
    description: "사주에 지혜로운 수(水)와 명석한 금(金)의 응집력이 두드러집니다. 복잡한 규칙이나 새로운 지식 체계를 분석하고, 조용한 몰입 속에서 나만의 논리와 전략을 완성해 나갈 때 가장 큰 지적 쾌감과 에너지 충전을 경험하는 유형입니다.",
  },
  ART: {
    category: "ART", nameKo: "예술형", coreElements: "토(土) + 오행 균형/혼합",
    headline: "풍부한 감각과 조화로운 표현의 예술형",
    description: "사주에 포용력의 토(土) 기운과 다채로운 오행의 감수성이 조화롭게 어우러져 있습니다. 일상 속 빛·소리·색채·촉감을 남들보다 섬세하게 포착하며, 내면의 감정과 영감을 눈과 손끝의 창작물로 표현할 때 깊은 행복감을 느끼는 유형입니다.",
  },
};

export const CATEGORY_ORDER: readonly CategoryType[] = ["SPORTS", "INTELLECT", "ART"];

// ─────────────────────────────────────────────────────────────
// [템플릿 그룹 4] 12개 소분류 취미 (12종)
// ─────────────────────────────────────────────────────────────
export interface HobbyTemplate {
  hobbyId: string;
  category: CategoryType;
  name: string;
  slug: string;
  primaryElement: ElementType;
  secondaryElement: ElementType;
  shortCopy: string;
  reasonTemplate: string;
  starterGuide: string;
  displayOrder: number;
}

export const HOBBY_TEMPLATES: readonly HobbyTemplate[] = [
  {
    hobbyId: "SPORTS_01", category: "SPORTS", name: "러닝", slug: "running",
    primaryElement: "fire", secondaryElement: "wood", displayOrder: 1,
    shortCopy: "심폐 에너지를 힘차게 발산하며 앞으로 나아가는 추진력의 취미",
    reasonTemplate: "사주 내 화(火)·목(木) 활동 에너지(주 오행 {{primaryPct}}%)가 역동적으로 작용하여, 심박수를 높이고 앞으로 달리는 러닝에서 답답함이 가장 시원하게 해소됩니다. 특히 {{weakestElementKo}} 기운의 순환을 돕는 규칙적인 호흡 리듬이 신체 활력을 빠르게 끌어올려 줍니다.",
    starterGuide: "러닝화 한 켤레와 20분 인터벌 달리기 앱(런데이 등)으로 오늘 저녁 가볍게 2km부터 시작해 보세요.",
  },
  {
    hobbyId: "SPORTS_02", category: "SPORTS", name: "클라이밍", slug: "climbing",
    primaryElement: "wood", secondaryElement: "earth", displayOrder: 2,
    shortCopy: "위로 뻗어 오르는 상승 기운과 전신 밸런스를 결합한 도전",
    reasonTemplate: "위로 뻗어 오르려는 목(木) 기운({{primaryPct}}%)과 중심을 잡는 토(土) 기운이 만나, 목표 홀드를 향해 한 단계씩 등반하는 클라이밍에서 강렬한 성취감을 느낍니다. 전신 코어와 악력을 고루 사용하여 {{weakestElementKo}} 에너지 밸런스를 잡는 데도 탁월합니다.",
    starterGuide: "동네 실내 볼더링 암장의 일일 체험권(기초 강습 + 암벽화 대여 포함)으로 첫 루트를 완등해 보세요.",
  },
  {
    hobbyId: "SPORTS_03", category: "SPORTS", name: "수영", slug: "swimming",
    primaryElement: "water", secondaryElement: "metal", displayOrder: 3,
    shortCopy: "물의 유연한 흐름 속에서 호흡과 리듬을 규칙적으로 제어하는 운동",
    reasonTemplate: "유연한 수(水) 기운({{primaryPct}}%)과 규칙적인 호흡의 금(金) 기운이 조화를 이루어, 물의 부력 속에서 전신을 리듬감 있게 움직이는 수영과 궁합이 매우 뛰어납니다. 관절에 무리를 주지 않으면서 {{weakestElementKo}} 기운의 전신 순환과 폐활량을 동시에 길러줍니다.",
    starterGuide: "인근 시립 체육센터의 초급 강습반에 등록하거나 주말 자유수영 1회권으로 물과 친해져 보세요.",
  },
  {
    hobbyId: "SPORTS_04", category: "SPORTS", name: "요가·필라테스", slug: "yoga-pilates",
    primaryElement: "wood", secondaryElement: "water", displayOrder: 4,
    shortCopy: "근육과 관절을 유연하게 뻗어내며 호흡과 내면의 정렬을 맞추는 수련",
    reasonTemplate: "신체를 유연하게 확장하는 목(木) 기운({{primaryPct}}%)과 내면의 흐름을 다스리는 수(水) 기운이 어우러져, 호흡과 코어 정렬에 집중하는 요가·필라테스에 깊이 몰입할 수 있습니다. 굳어 있는 근육을 이완하고 {{weakestElementKo}} 에너지의 불균형을 바로잡는 데 최적입니다.",
    starterGuide: "거실에 요가 매트를 펴고 유튜브 15분 모닝 스트레칭·코어 루틴 영상을 따라 하며 호흡을 정돈해 보세요.",
  },
  {
    hobbyId: "INTELLECT_01", category: "INTELLECT", name: "독서·글쓰기", slug: "reading-writing",
    primaryElement: "water", secondaryElement: "wood", displayOrder: 5,
    shortCopy: "깊은 사유의 바다에서 통찰을 길어 올려 나만의 문장으로 틔우는 취미",
    reasonTemplate: "깊은 사색을 상징하는 수(水) 기운({{primaryPct}}%)을 바탕으로 지식을 흡수하고, 이를 목(木)의 생명력 있는 문장으로 엮어내는 능력이 돋보입니다. 조용히 책을 읽고 생각을 기록하는 시간은 과열된 일상을 식히고 {{weakestElementKo}} 기운을 차분히 보완해 줍니다.",
    starterGuide: "하루 15쪽 독서와 인상 깊은 문장 3줄 필사·단상 노트를 작성하는 가벼운 루틴부터 시작해 보세요.",
  },
  {
    hobbyId: "INTELLECT_02", category: "INTELLECT", name: "보드게임·체스", slug: "boardgame-chess",
    primaryElement: "metal", secondaryElement: "water", displayOrder: 6,
    shortCopy: "명확한 규칙과 수읽기 속에서 냉철한 판단력과 전략을 겨루는 두뇌 게임",
    reasonTemplate: "명쾌한 결단력의 금(金) 기운({{primaryPct}}%)과 치밀한 수읽기의 수(水) 기운이 결합되어, 정해진 규칙 안에서 최선의 수를 찾아내는 체스·전략 보드게임에서 두뇌가 반짝입니다. 잡념을 지우고 고도의 집중력을 발휘하며 {{weakestElementKo}} 에너지까지 정돈할 수 있습니다.",
    starterGuide: "스마트폰 체스 앱(Chess.com 등)의 하루 5분 전술 퍼즐 모드나 1인 전략 보드게임으로 가볍게 입문해 보세요.",
  },
  {
    hobbyId: "INTELLECT_03", category: "INTELLECT", name: "코딩·메이커", slug: "coding-maker",
    primaryElement: "metal", secondaryElement: "fire", displayOrder: 7,
    shortCopy: "정교한 논리 구조를 설계해 실제로 작동하는 결과물을 구현하는 창작",
    reasonTemplate: "구조적 논리를 세우는 금(金) 기운({{primaryPct}}%)과 이를 눈에 보이는 결과물로 구현하는 화(火)의 실행력이 만나, 코딩·메이커 활동에서 높은 몰입도를 보입니다. 내 손으로 문제를 해결하고 자동화 도구를 완성하는 과정이 {{weakestElementKo}} 기운의 활력을 자극합니다.",
    starterGuide: "웹 브라우저에서 바로 실행되는 파이썬 기초 튜토리얼이나 노코드 업무 자동화 미니 프로젝트 하나를 만들어 보세요.",
  },
  {
    hobbyId: "INTELLECT_04", category: "INTELLECT", name: "외국어 학습", slug: "foreign-language",
    primaryElement: "water", secondaryElement: "fire", displayOrder: 8,
    shortCopy: "새로운 언어 체계를 흡수하고 세상과 넓게 소통하는 지적 확장",
    reasonTemplate: "유연하게 패턴을 흡수하는 수(水) 기운({{primaryPct}}%)과 외부 세계로 표현을 넓히는 화(火)의 소통 에너지가 조화를 이루어 외국어 학습에 강점이 있습니다. 새로운 언어로 말문이 트이는 자극이 일상의 매너리즘을 깨고 {{weakestElementKo}} 기운에 생기를 불어넣습니다.",
    starterGuide: "하루 10분 회화 앱(듀오링고 등)과 좋아하는 해외 드라마·유튜브 1문장 쉐도잉으로 부담 없이 시작해 보세요.",
  },
  {
    hobbyId: "ART_01", category: "ART", name: "그림·드로잉", slug: "drawing",
    primaryElement: "earth", secondaryElement: "wood", displayOrder: 9,
    shortCopy: "일상의 풍경과 감정을 종이 위에 선과 색으로 차분히 담아내는 표현",
    reasonTemplate: "대상을 차분히 관찰하고 수용하는 토(土) 기운({{primaryPct}}%)과 생동감 있는 선을 뻗어내는 목(木) 기운이 어우러져 그림·드로잉에 천부적인 감각을 발휘합니다. 손끝으로 선과 색을 채워나가는 무념무상의 시간이 {{weakestElementKo}} 에너지의 피로를 부드럽게 다독여 줍니다.",
    starterGuide: "펜 하나와 손바닥만 한 크로키북(또는 태블릿)을 준비해 오늘 마신 커피잔이나 창밖 풍경을 5분간 스케치해 보세요.",
  },
  {
    hobbyId: "ART_02", category: "ART", name: "악기 연주", slug: "instrument",
    primaryElement: "fire", secondaryElement: "metal", displayOrder: 10,
    shortCopy: "정교한 음계와 박자 위에서 감정의 울림을 소리로 발산하는 예술",
    reasonTemplate: "정교한 박자와 음계를 짚어내는 금(金)의 감각과 내면의 감정을 소리로 발산하는 화(火) 기운({{primaryPct}}%)이 만나 악기 연주에서 깊은 카타르시스를 얻습니다. 손끝의 진동과 멜로디에 집중하는 과정이 {{weakestElementKo}} 기운의 긴장을 조화롭게 풀어줍니다.",
    starterGuide: "칼림바·우쿨렐레·미디 키보드 등 집에서도 독학하기 좋은 악기로 가장 좋아하는 노래 1곡 완주에 도전해 보세요.",
  },
  {
    hobbyId: "ART_03", category: "ART", name: "사진·영상 촬영", slug: "photo-video",
    primaryElement: "metal", secondaryElement: "earth", displayOrder: 11,
    shortCopy: "찰나의 빛과 구도를 프레임으로 포착해 시간의 기록으로 남기는 작업",
    reasonTemplate: "찰나의 구도와 빛을 예리하게 포착하는 금(金) 기운({{primaryPct}}%)과 일상의 순간을 묵직한 기록으로 남기는 토(土) 기운이 시너지를 내어 사진·영상 촬영에 탁월한 안목을 보입니다. 시선을 바꿔 세상을 관찰하는 산책이 {{weakestElementKo}} 에너지를 자연스럽게 충전해 줍니다.",
    starterGuide: "스마트폰 카메라의 격자선(Grid) 기능을 켜고 동네 산책길의 빛과 그림자를 10장 찍어 무료 보정 앱으로 색감을 입혀보세요.",
  },
  {
    hobbyId: "ART_04", category: "ART", name: "도예·공예", slug: "pottery-craft",
    primaryElement: "earth", secondaryElement: "water", displayOrder: 12,
    shortCopy: "흙과 재료의 물성을 손끝으로 빚어내며 온전한 몰입을 경험하는 수공예",
    reasonTemplate: "흙과 자연 재료를 뜻하는 토(土) 기운({{primaryPct}}%)과 부드럽게 형태를 빚어내는 수(水)의 유연함이 결합되어 도예·공예에서 깊은 심리적 안정감을 느낍니다. 손끝의 촉각에 온전히 집중하는 시간이 복잡한 생각을 비우고 {{weakestElementKo}} 기운의 균형을 되찾아 줍니다.",
    starterGuide: "주말 공방 원데이 클래스(나만의 머그컵·트레이 만들기)를 예약하거나 홈 에어드라이 클레이 키트로 소품을 빚어보세요.",
  },
];

export const HOBBY_BY_ID: Record<string, HobbyTemplate> = Object.fromEntries(
  HOBBY_TEMPLATES.map((h) => [h.hobbyId, h]),
);

// ─────────────────────────────────────────────────────────────
// 치환·웰니스 판정 유틸 (순수 함수)
// ─────────────────────────────────────────────────────────────

/** 취미 추천 사유 템플릿 내 {{primaryPct}}, {{strongestElementKo}}, {{weakestElementKo}} 치환 */
export function interpolateHobbyReason(
  reasonTemplate: string,
  params: {
    primaryPct: number;
    strongestElement: ElementType;
    weakestElement: ElementType;
  },
): string {
  return reasonTemplate
    .replace(/\{\{primaryPct\}\}/g, params.primaryPct.toFixed(1))
    .replace(/\{\{strongestElementKo\}\}/g, ELEMENT_KO_LABEL[params.strongestElement])
    .replace(/\{\{weakestElementKo\}\}/g, ELEMENT_KO_LABEL[params.weakestElement]);
}

const ELEMENT_CODE: Record<ElementType, string> = {
  wood: "WOOD",
  fire: "FIRE",
  earth: "EARTH",
  metal: "METAL",
  water: "WATER",
};

/**
 * 오행 분포에서 웰니스 템플릿 ID를 결정한다.
 * - 최고-최저 차이가 15%p 이하이면 WELL_BALANCED
 * - 그 외에는 최저 오행의 DEFICIENT, 최고 오행이 35% 이상이면 EXCESSIVE를 보조로 추가
 */
export function resolveWellnessTemplateIds(
  elements: Record<ElementType, number>,
  strongest: ElementType,
  weakest: ElementType,
): { primaryId: string; secondaryId?: string; isBalanced: boolean } {
  const maxVal = elements[strongest];
  const minVal = elements[weakest];

  if (maxVal - minVal <= 15) {
    return { primaryId: "WELL_BALANCED", isBalanced: true };
  }

  return {
    primaryId: `WELL_${ELEMENT_CODE[weakest]}_DEF`,
    secondaryId: maxVal >= 35 ? `WELL_${ELEMENT_CODE[strongest]}_EXC` : undefined,
    isBalanced: false,
  };
}
