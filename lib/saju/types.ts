export type ElementType = "wood" | "fire" | "earth" | "metal" | "water";
export type CategoryType = "SPORTS" | "INTELLECT" | "ART";
export type CalendarType = "solar" | "lunar" | "leap";
export type GenderType = "M" | "F";
export type StemCode =
  | "STEM_GAP"
  | "STEM_EUL"
  | "STEM_BYEONG"
  | "STEM_JEONG"
  | "STEM_MU"
  | "STEM_GI"
  | "STEM_GYEONG"
  | "STEM_SIN"
  | "STEM_IM"
  | "STEM_GYE";
export type WellnessState = "DEFICIENT" | "EXCESSIVE" | "BALANCED";

export const ELEMENT_ORDER: readonly ElementType[] = ["wood", "fire", "earth", "metal", "water"];

export interface BirthInput {
  birthDate: string; // 'YYYY-MM-DD'
  birthTime: string | null; // 'HH:mm' 또는 null (시간 모름)
  calendarType: CalendarType;
  gender: GenderType;
}

/** 한 기둥(柱). stem/branch는 한글 한 글자(예: '경', '오'). */
export interface Pillar {
  stem: string;
  branch: string;
}

/** 만세력 계산 결과. hour가 null이면 시간 미입력(삼주 6글자). */
export interface SajuData {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
}

export interface DayMasterProfile {
  stemCode: StemCode;
  nameKo: string; // 예: '병화(丙火)'
  element: ElementType;
  nickname: string;
  summary: string;
}

export interface WellnessGuide {
  templateId: string;
  state: WellnessState;
  targetElement: ElementType | "all";
  bodyAxis: string;
  content: string;
  careKeywords: string[];
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
  rank: number; // 1 ~ 12
  shortCopy: string;
  matchReason: string;
  starterGuide: string;
}

export interface JudgeResult {
  saju: SajuData;
  dayMaster: DayMasterProfile;
  elements: Record<ElementType, number>;
  strongestElement: ElementType;
  weakestElement: ElementType;
  isBalanced: boolean;
  wellness: {
    primary: WellnessGuide;
    secondary?: WellnessGuide;
  };
  categoryScores: Record<CategoryType, number>;
  topCategory: CategorySummary;
  topHobby: HobbyScoreItem;
  allHobbies: HobbyScoreItem[];
}
