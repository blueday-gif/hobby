import { describe, expect, it } from "vitest";
import { calculateSajuData, validateBirthInput } from "@/lib/saju/calculator";
import { calcElementDistribution, judge, judgeCategories } from "@/lib/saju/judge";
import {
  CATEGORY_TEMPLATES,
  DAY_MASTER_TEMPLATES,
  HOBBY_TEMPLATES,
  WELLNESS_TEMPLATES,
  interpolateHobbyReason,
  resolveWellnessTemplateIds,
} from "@/lib/saju/templates";
import type { BirthInput, ElementType, Pillar, SajuData } from "@/lib/saju/types";

const pillar = (value: string): Pillar => ({ stem: value[0], branch: value[1] });
const makeSaju = (year: string, month: string, day: string, hour: string | null): SajuData => ({
  year: pillar(year),
  month: pillar(month),
  day: pillar(day),
  hour: hour ? pillar(hour) : null,
});

const sumOf = (elements: Record<ElementType, number>) =>
  Object.values(elements).reduce((sum, value) => sum + value, 0);

// 화·목만 있는 원국 / 수·금만 있는 원국 / 오행이 고르게 퍼진 원국
const SPORTS_SAJU = makeSaju("병인", "갑오", "병인", "정묘");
const INTELLECT_SAJU = makeSaju("임자", "경신", "임자", "신유");
const BALANCED_SAJU = makeSaju("갑오", "경자", "무사", "신인");

describe("템플릿 데이터 무결성", () => {
  it("36종 템플릿(10 + 11 + 3 + 12)이 모두 있다", () => {
    expect(Object.keys(DAY_MASTER_TEMPLATES)).toHaveLength(10);
    expect(Object.keys(WELLNESS_TEMPLATES)).toHaveLength(11);
    expect(Object.keys(CATEGORY_TEMPLATES)).toHaveLength(3);
    expect(HOBBY_TEMPLATES).toHaveLength(12);
  });
});

describe("judge(saju)", () => {
  it("TC-JUDGE-01 결정론: 같은 입력을 100회 호출해도 결과가 100% 같다", () => {
    const first = JSON.stringify(judge(BALANCED_SAJU));
    for (let i = 0; i < 100; i += 1) {
      expect(JSON.stringify(judge(BALANCED_SAJU))).toBe(first);
    }
  });

  it("TC-JUDGE-02 운동형 1위: 화·목 비중이 큰 원국", () => {
    const result = judge(SPORTS_SAJU);
    expect(result.elements.fire + result.elements.wood).toBeGreaterThanOrEqual(70);
    expect(result.topCategory.category).toBe("SPORTS");
    expect(result.topHobby.category).toBe("SPORTS");
  });

  it("TC-JUDGE-03 지능형 1위: 수·금 비중이 큰 원국", () => {
    const result = judge(INTELLECT_SAJU);
    expect(result.elements.water + result.elements.metal).toBeGreaterThanOrEqual(70);
    expect(result.topCategory.category).toBe("INTELLECT");
    expect(result.topHobby.category).toBe("INTELLECT");
  });

  it("TC-JUDGE-04 예술형 1위: 오행이 고르게 분포하면 균형 보너스로 예술형", () => {
    const result = judge(BALANCED_SAJU);
    expect(result.topCategory.category).toBe("ART");
    expect(result.topHobby.category).toBe("ART");
  });

  it("TC-JUDGE-05 동점이면 일간 → 월지 → 고정 순서로 분류를 정한다", () => {
    // 운동형·지능형 원점수가 같은 상태 (일간 수의 가산점 5점 포함)
    const tied = judgeCategories(
      { wood: 30, fire: 30, earth: 0, metal: 25, water: 25 },
      "water",
      "fire",
    );
    expect(tied.raw.SPORTS).toBeCloseTo(tied.raw.INTELLECT, 9);
    expect(tied.ranking[0]).toBe("INTELLECT");

    // 일간이 예술형(토)이라 동점 규칙에 걸리지 않으면 월지 오행이 우선
    const elements = { wood: 30, fire: 30, earth: 0, metal: 30, water: 30 };
    expect(judgeCategories(elements, "earth", "water").ranking[0]).toBe("INTELLECT");
    expect(judgeCategories(elements, "earth", "fire").ranking[0]).toBe("SPORTS");
    // 일간·월지 모두 해당이 없으면 고정 순서(SPORTS > INTELLECT > ART)
    expect(judgeCategories(elements, "earth", "earth").ranking[0]).toBe("SPORTS");
  });

  it("TC-JUDGE-06 출생시간 모름(6글자)도 오류 없이 정규화된다", () => {
    const saju = makeSaju("경오", "신사", "경진", null);
    const result = judge(saju);
    expect(Math.abs(sumOf(result.elements) - 100)).toBeLessThanOrEqual(0.1);
    expect(result.allHobbies).toHaveLength(12);
    expect(result.allHobbies.map((h) => h.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("오행 합계는 8글자·6글자 모두 항상 100.0이다", () => {
    const samples = [SPORTS_SAJU, INTELLECT_SAJU, BALANCED_SAJU, makeSaju("정해", "임오", "갑술", "기미")];
    for (const saju of samples) {
      expect(sumOf(calcElementDistribution(saju))).toBeCloseTo(100, 6);
      expect(sumOf(calcElementDistribution({ ...saju, hour: null }))).toBeCloseTo(100, 6);
    }
  });

  it("TC-JUDGE-07 오행 균형형은 억지 결핍 진단 없이 WELL_BALANCED", () => {
    const ids = resolveWellnessTemplateIds(
      { wood: 22, fire: 21, earth: 20, metal: 19, water: 18 },
      "wood",
      "water",
    );
    expect(ids).toEqual({ primaryId: "WELL_BALANCED", isBalanced: true });

    const result = judge(BALANCED_SAJU);
    expect(result.isBalanced).toBe(true);
    expect(result.wellness.primary.templateId).toBe("WELL_BALANCED");
    expect(result.wellness.secondary).toBeUndefined();
  });

  it("TC-JUDGE-08 취미 추천 사유의 수치(%)와 오행 이름이 치환된다", () => {
    // 화(火) 38.9%, 수(水) 0%인 원국
    const result = judge(makeSaju("병인", "경오", "무사", "신진"));
    expect(result.elements.fire).toBe(38.9);
    expect(result.weakestElement).toBe("water");

    const running = result.allHobbies.find((hobby) => hobby.hobbyId === "SPORTS_01");
    expect(running?.matchReason).toContain("38.9%");
    expect(running?.matchReason).toContain("수(水)");
    for (const hobby of result.allHobbies) {
      expect(hobby.matchReason).not.toContain("{{");
    }

    // 최저 수(水) 부족 + 최고 화(火) 35% 이상 → 부족 가이드 + 과다 가이드
    expect(result.wellness.primary.templateId).toBe("WELL_WATER_DEF");
    expect(result.wellness.secondary?.templateId).toBe("WELL_FIRE_EXC");
  });

  it("interpolateHobbyReason은 세 변수를 모두 치환한다", () => {
    const text = interpolateHobbyReason("{{primaryPct}}|{{strongestElementKo}}|{{weakestElementKo}}", {
      primaryPct: 38.9,
      strongestElement: "fire",
      weakestElement: "water",
    });
    expect(text).toBe("38.9|화(火)|수(水)");
  });
});

describe("만세력 계산", () => {
  const base: BirthInput = { birthDate: "1990-05-15", birthTime: "14:30", calendarType: "solar", gender: "M" };

  it("1990-05-15 14:30 → 경오 · 신사 · 경진 · 계미 (진태양시 보정)", () => {
    const saju = calculateSajuData(base);
    expect(saju.year).toEqual({ stem: "경", branch: "오" });
    expect(saju.month).toEqual({ stem: "신", branch: "사" });
    expect(saju.day).toEqual({ stem: "경", branch: "진" });
    expect(saju.hour).toEqual({ stem: "계", branch: "미" });
  });

  it("출생시간을 모르면 시주가 null이다", () => {
    expect(calculateSajuData({ ...base, birthTime: null }).hour).toBeNull();
  });

  it("음력 2024-01-01은 양력 2024-02-10과 같은 사주다", () => {
    const lunar = calculateSajuData({ ...base, birthDate: "2024-01-01", calendarType: "lunar", birthTime: null });
    const solar = calculateSajuData({ ...base, birthDate: "2024-02-10", birthTime: null });
    expect(lunar).toEqual(solar);
    expect(lunar.year).toEqual({ stem: "갑", branch: "진" });
  });

  it("잘못된 입력은 한국어 오류 메시지를 돌려준다", () => {
    expect(validateBirthInput({ ...base, birthDate: "1800-01-01" })).toContain("1900");
    expect(validateBirthInput({ ...base, birthDate: "2023-02-30" })).toContain("존재하지 않는");
    expect(validateBirthInput({ ...base, birthTime: "25:00" })).toContain("HH:mm");
    expect(() => calculateSajuData({ ...base, birthDate: "abcd" })).toThrow();
    expect(validateBirthInput(base)).toBeNull();
  });
});
