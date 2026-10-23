import {
  CATEGORY_ORDER,
  CATEGORY_TEMPLATES,
  DAY_MASTER_TEMPLATES,
  HOBBY_TEMPLATES,
  STEM_KO_TO_CODE,
  WELLNESS_TEMPLATES,
  interpolateHobbyReason,
  resolveWellnessTemplateIds,
} from "./templates";
import {
  ELEMENT_ORDER,
  type CategoryType,
  type DayMasterProfile,
  type ElementType,
  type HobbyScoreItem,
  type JudgeResult,
  type SajuData,
  type WellnessGuide,
} from "./types";

// ─────────────────────────────────────────────────────────────
// 오행 매핑 (PRD 4.2)
// ─────────────────────────────────────────────────────────────
const STEM_ELEMENT: Record<string, ElementType> = {
  갑: "wood", 을: "wood",
  병: "fire", 정: "fire",
  무: "earth", 기: "earth",
  경: "metal", 신: "metal",
  임: "water", 계: "water",
};

/** 지지는 본기(本氣) 오행으로 계산한다. */
const BRANCH_ELEMENT: Record<string, ElementType> = {
  인: "wood", 묘: "wood",
  사: "fire", 오: "fire",
  진: "earth", 술: "earth", 축: "earth", 미: "earth",
  신: "metal", 유: "metal",
  해: "water", 자: "water",
};

export function stemElement(stem: string): ElementType {
  const element = STEM_ELEMENT[stem];
  if (!element) throw new Error(`알 수 없는 천간: ${stem}`);
  return element;
}

export function branchElement(branch: string): ElementType {
  const element = BRANCH_ELEMENT[branch];
  if (!element) throw new Error(`알 수 없는 지지: ${branch}`);
  return element;
}

const round1 = (value: number): number => Math.round(value * 10) / 10;

// ─────────────────────────────────────────────────────────────
// 1. 오행 분포 (PRD 4.2) — 자리별 가중치 후 백분율 정규화
// ─────────────────────────────────────────────────────────────
export function calcElementDistribution(saju: SajuData): Record<ElementType, number> {
  const weights: Record<ElementType, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  let total = 0;
  const add = (element: ElementType, weight: number) => {
    weights[element] += weight;
    total += weight;
  };

  add(stemElement(saju.year.stem), 1.0);
  add(branchElement(saju.year.branch), 1.0);
  add(stemElement(saju.month.stem), 1.0);
  add(branchElement(saju.month.branch), 1.5); // 월지
  add(stemElement(saju.day.stem), 1.5); // 일간
  add(branchElement(saju.day.branch), 1.0);
  if (saju.hour) {
    add(stemElement(saju.hour.stem), 1.0);
    add(branchElement(saju.hour.branch), 1.0);
  }

  // 소수 첫째 자리 반올림 후에도 합이 정확히 100.0이 되도록 최대잔여법으로 배분한다.
  const rows = ELEMENT_ORDER.map((element, order) => {
    const tenths = (weights[element] / total) * 1000;
    const floor = Math.floor(tenths + 1e-9);
    return { element, order, floor, remainder: tenths - floor };
  });
  let missing = 1000 - rows.reduce((sum, row) => sum + row.floor, 0);
  [...rows]
    .sort((a, b) => b.remainder - a.remainder || a.order - b.order)
    .forEach((row) => {
      if (missing > 0) {
        row.floor += 1;
        missing -= 1;
      }
    });

  const result = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 } as Record<ElementType, number>;
  for (const row of rows) result[row.element] = row.floor / 10;
  return result;
}

// ─────────────────────────────────────────────────────────────
// 2. 3대 대분류 (PRD 4.3)
// ─────────────────────────────────────────────────────────────
const ELEMENT_CATEGORY: Record<ElementType, CategoryType> = {
  wood: "SPORTS",
  fire: "SPORTS",
  water: "INTELLECT",
  metal: "INTELLECT",
  earth: "ART",
};

const TIE_EPSILON = 1e-9;

export interface CategoryJudgement {
  raw: Record<CategoryType, number>;
  scores: Record<CategoryType, number>;
  /** 점수 내림차순 + 동점 규칙이 적용된 순위 */
  ranking: CategoryType[];
}

export function judgeCategories(
  elements: Record<ElementType, number>,
  dayElement: ElementType,
  monthBranchElement: ElementType,
): CategoryJudgement {
  const sigma = Math.sqrt(
    ELEMENT_ORDER.reduce((sum, element) => sum + (elements[element] - 20) ** 2, 0) / 5,
  );
  const balanceBonus = Math.max(0, 18 - 0.6 * sigma);

  const raw: Record<CategoryType, number> = {
    SPORTS:
      0.55 * elements.fire + 0.45 * elements.wood +
      (dayElement === "wood" || dayElement === "fire" ? 5 : 0),
    INTELLECT:
      0.55 * elements.water + 0.45 * elements.metal +
      (dayElement === "water" || dayElement === "metal" ? 5 : 0),
    ART:
      0.65 * elements.earth +
      balanceBonus +
      0.15 * Math.min(elements.wood, elements.fire) +
      0.15 * Math.min(elements.metal, elements.water) +
      (dayElement === "earth" ? 5 : 0),
  };

  const total = raw.SPORTS + raw.INTELLECT + raw.ART;
  const scores = {
    SPORTS: round1((raw.SPORTS / total) * 100),
    INTELLECT: round1((raw.INTELLECT / total) * 100),
    ART: round1((raw.ART / total) * 100),
  };

  // 동점 규칙: ① 일간 오행 소속 분류 → ② 월지 오행 소속 분류 → ③ 고정 순서
  const tieRank = (category: CategoryType): number => {
    if (ELEMENT_CATEGORY[dayElement] === category) return 0;
    if (ELEMENT_CATEGORY[monthBranchElement] === category) return 1;
    return 2;
  };
  const ranking = [...CATEGORY_ORDER].sort((a, b) => {
    const diff = raw[b] - raw[a];
    if (Math.abs(diff) > TIE_EPSILON) return diff;
    return tieRank(a) - tieRank(b) || CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b);
  });

  return { raw, scores, ranking };
}

// ─────────────────────────────────────────────────────────────
// 3. 12개 소분류 취미 (PRD 4.4)
// ─────────────────────────────────────────────────────────────
export function rankHobbies(params: {
  elements: Record<ElementType, number>;
  categoryScores: Record<CategoryType, number>;
  categoryRanking: CategoryType[];
  dayElement: ElementType;
  strongestElement: ElementType;
  weakestElement: ElementType;
}): HobbyScoreItem[] {
  const { elements, categoryScores, categoryRanking, dayElement, strongestElement, weakestElement } = params;

  const scored = HOBBY_TEMPLATES.map((hobby) => {
    const primaryPct = elements[hobby.primaryElement];
    const secondaryPct = elements[hobby.secondaryElement];

    // 보완 가산점: 주/보조 오행이 일간 오행과 같으면 +4, 가장 부족한 오행과 같으면 +3 (각각 1회)
    const matchesElement = (target: ElementType) =>
      hobby.primaryElement === target || hobby.secondaryElement === target;
    const complement = (matchesElement(dayElement) ? 4 : 0) + (matchesElement(weakestElement) ? 3 : 0);

    const score = round1(
      0.4 * categoryScores[hobby.category] + 0.4 * primaryPct + 0.2 * secondaryPct + complement,
    );

    return { hobby, score, primaryPct };
  });

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      categoryRanking.indexOf(a.hobby.category) - categoryRanking.indexOf(b.hobby.category) ||
      a.hobby.displayOrder - b.hobby.displayOrder,
  );

  return scored.map(({ hobby, score, primaryPct }, index) => ({
    hobbyId: hobby.hobbyId,
    name: hobby.name,
    category: hobby.category,
    primaryElement: hobby.primaryElement,
    secondaryElement: hobby.secondaryElement,
    score,
    rank: index + 1,
    shortCopy: hobby.shortCopy,
    matchReason: interpolateHobbyReason(hobby.reasonTemplate, {
      primaryPct,
      strongestElement,
      weakestElement,
    }),
    starterGuide: hobby.starterGuide,
  }));
}

// ─────────────────────────────────────────────────────────────
// 4. 최종 판정 — 순수 함수 judge(saju) → JudgeResult
// ─────────────────────────────────────────────────────────────
function cloneWellness(id: string): WellnessGuide {
  const template = WELLNESS_TEMPLATES[id];
  return { ...template, careKeywords: [...template.careKeywords] };
}

export function judge(saju: SajuData): JudgeResult {
  const stemCode = STEM_KO_TO_CODE[saju.day.stem];
  if (!stemCode) throw new Error(`알 수 없는 일간: ${saju.day.stem}`);
  const dayTemplate = DAY_MASTER_TEMPLATES[stemCode];
  const dayMaster: DayMasterProfile = {
    stemCode: dayTemplate.stemCode,
    nameKo: dayTemplate.nameKo,
    element: dayTemplate.element,
    nickname: dayTemplate.nickname,
    summary: dayTemplate.summary,
  };

  const elements = calcElementDistribution(saju);

  // 동률이면 목→화→토→금→수 순서로 먼저 나온 오행을 택한다.
  let strongestElement = ELEMENT_ORDER[0];
  let weakestElement = ELEMENT_ORDER[0];
  for (const element of ELEMENT_ORDER) {
    if (elements[element] > elements[strongestElement]) strongestElement = element;
    if (elements[element] < elements[weakestElement]) weakestElement = element;
  }

  const wellnessIds = resolveWellnessTemplateIds(elements, strongestElement, weakestElement);
  const wellness = {
    primary: cloneWellness(wellnessIds.primaryId),
    secondary: wellnessIds.secondaryId ? cloneWellness(wellnessIds.secondaryId) : undefined,
  };

  const categories = judgeCategories(elements, dayMaster.element, branchElement(saju.month.branch));
  const topCategoryTemplate = CATEGORY_TEMPLATES[categories.ranking[0]];

  const allHobbies = rankHobbies({
    elements,
    categoryScores: categories.scores,
    categoryRanking: categories.ranking,
    dayElement: dayMaster.element,
    strongestElement,
    weakestElement,
  });

  return {
    saju,
    dayMaster,
    elements,
    strongestElement,
    weakestElement,
    isBalanced: wellnessIds.isBalanced,
    wellness,
    categoryScores: categories.scores,
    topCategory: {
      category: topCategoryTemplate.category,
      nameKo: topCategoryTemplate.nameKo,
      headline: topCategoryTemplate.headline,
      description: topCategoryTemplate.description,
      score: categories.scores[topCategoryTemplate.category],
    },
    topHobby: allHobbies[0],
    allHobbies,
  };
}
