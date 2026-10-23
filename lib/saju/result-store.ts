import { judge } from "./judge";
import { DAY_MASTER_TEMPLATES } from "./templates";
import type {
  CategorySummary,
  CategoryType,
  ElementType,
  HobbyScoreItem,
  JudgeResult,
  SajuData,
  StemCode,
  WellnessGuide,
} from "./types";

/** 결과 화면이 그리는 데이터. 공유 화면에서는 원국(saju)을 숨기므로 선택 값이다. */
export type ResultViewData = Omit<JudgeResult, "saju"> & { saju?: SajuData | null };

/** results.scores(JSONB)에 저장하는 형태. saju·dayMaster는 별도 컬럼/템플릿에서 복원한다. */
export interface StoredScores {
  elements: Record<ElementType, number>;
  strongestElement: ElementType;
  weakestElement: ElementType;
  isBalanced: boolean;
  wellness: { primary: WellnessGuide; secondary?: WellnessGuide };
  categoryScores: Record<CategoryType, number>;
  topCategory: CategorySummary;
  allHobbies: HobbyScoreItem[];
}

/** results.saju_palja(JSONB)에 저장하는 형태 */
export interface StoredPalja {
  saju: SajuData;
  stemCode: StemCode;
}

export function toStoredScores(result: JudgeResult): StoredScores {
  return {
    elements: result.elements,
    strongestElement: result.strongestElement,
    weakestElement: result.weakestElement,
    isBalanced: result.isBalanced,
    wellness: result.wellness,
    categoryScores: result.categoryScores,
    topCategory: result.topCategory,
    allHobbies: result.allHobbies,
  };
}

export function toStoredPalja(result: JudgeResult): StoredPalja {
  return { saju: result.saju, stemCode: result.dayMaster.stemCode };
}

function isStoredScores(value: unknown): value is StoredScores {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<StoredScores>;
  return (
    typeof v.elements === "object" &&
    v.elements !== null &&
    typeof v.categoryScores === "object" &&
    v.categoryScores !== null &&
    typeof v.wellness === "object" &&
    v.wellness !== null &&
    typeof v.topCategory === "object" &&
    v.topCategory !== null &&
    Array.isArray(v.allHobbies) &&
    v.allHobbies.length > 0
  );
}

function isStoredPalja(value: unknown): value is StoredPalja {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<StoredPalja>;
  return typeof v.saju === "object" && v.saju !== null && typeof v.stemCode === "string";
}

/** 공유 뷰(shared_results_view) 행에서 생년월일시를 뺀 결과를 복원한다. */
export function rebuildSharedResult(stemCode: string, scoresValue: unknown): ResultViewData | null {
  const template = DAY_MASTER_TEMPLATES[stemCode as StemCode];
  if (!template || !isStoredScores(scoresValue)) return null;
  return {
    saju: null,
    dayMaster: {
      stemCode: template.stemCode,
      nameKo: template.nameKo,
      element: template.element,
      nickname: template.nickname,
      summary: template.summary,
    },
    ...scoresValue,
    topHobby: scoresValue.allHobbies[0],
  };
}

/**
 * DB에 저장된 값을 JudgeResult로 복원한다.
 * 저장 형태가 예상과 다르면 원국(saju)으로 다시 판정한다. judge는 결정론적 순수 함수라 안전하다.
 */
export function rebuildResult(paljaValue: unknown, scoresValue: unknown): JudgeResult | null {
  if (!isStoredPalja(paljaValue)) return null;
  const { saju, stemCode } = paljaValue;

  const template = DAY_MASTER_TEMPLATES[stemCode];
  if (!template || !isStoredScores(scoresValue)) {
    try {
      return judge(saju);
    } catch {
      return null;
    }
  }

  return {
    saju,
    dayMaster: {
      stemCode: template.stemCode,
      nameKo: template.nameKo,
      element: template.element,
      nickname: template.nickname,
      summary: template.summary,
    },
    ...scoresValue,
    topHobby: scoresValue.allHobbies[0],
  };
}
