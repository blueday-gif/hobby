import { solarToLunar } from "@fullstackfamily/manseryeok";
import { describe, expect, it } from "vitest";
import { calculateSajuData, SajuInputError } from "@/lib/saju/calculator";

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

function solarParts(t: number) {
  const date = new Date(t);
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
}

/** 양력 날짜로 구한 사주와, 그 날의 음력 날짜로 구한 사주가 같아야 한다. */
function expectLunarMatchesSolar(t: number) {
  const { y, m, d } = solarParts(t);
  const { lunar } = solarToLunar(y, m, d);

  const fromSolar = calculateSajuData({
    birthDate: `${y}-${pad(m)}-${pad(d)}`,
    birthTime: "12:30",
    calendarType: "solar",
    gender: "M",
  });
  const fromLunar = calculateSajuData({
    birthDate: `${lunar.year}-${pad(lunar.month)}-${pad(lunar.day)}`,
    birthTime: "12:30",
    calendarType: lunar.isLeapMonth ? "leap" : "lunar",
    gender: "M",
  });
  expect(fromLunar).toEqual(fromSolar);
}

/** 1990년에서 실제로 29일까지만 있는 음력 달을 찾아 (연, 월)을 돌려준다. */
function findShortLunarMonth(): { year: number; month: number } {
  for (let t = Date.UTC(1990, 1, 1); t < Date.UTC(1991, 0, 1); t += DAY_MS) {
    const a = solarParts(t);
    const b = solarParts(t + DAY_MS);
    const la = solarToLunar(a.y, a.m, a.d).lunar;
    const lb = solarToLunar(b.y, b.m, b.d).lunar;
    if (la.day === 29 && lb.day === 1 && !la.isLeapMonth && la.year === 1990) {
      return { year: la.year, month: la.month };
    }
  }
  throw new Error("29일까지인 음력 달을 찾지 못했어요.");
}

describe("음력 입력", () => {
  it("1971년 음력 11월 25일(만세력 라이브러리가 오류를 내던 날짜)도 계산된다", () => {
    const saju = calculateSajuData({
      birthDate: "1971-11-25",
      birthTime: "12:30",
      calendarType: "lunar",
      gender: "M",
    });
    expect(saju.year.stem).toBe("신");
    expect(saju.year.branch).toBe("해");
  });

  it("1971년 전체: 모든 날짜에서 음력 입력 결과가 양력 입력 결과와 같다", () => {
    for (let t = Date.UTC(1971, 0, 1); t <= Date.UTC(1971, 11, 31); t += DAY_MS) {
      expectLunarMatchesSolar(t);
    }
  });

  it("1901~2025년: 5일 간격 표본이 모두 같다", () => {
    for (let t = Date.UTC(1901, 0, 1); t <= Date.UTC(2025, 11, 31); t += 5 * DAY_MS) {
      expectLunarMatchesSolar(t);
    }
  });

  it("그 달에 없는 날짜(29일까지인 달의 30일)는 입력 오류가 된다", () => {
    const { year, month } = findShortLunarMonth();
    expect(() =>
      calculateSajuData({
        birthDate: `${year}-${pad(month)}-30`,
        birthTime: null,
        calendarType: "lunar",
        gender: "M",
      }),
    ).toThrow(SajuInputError);
  });

  it("윤달이 없는 해의 윤달은 입력 오류가 된다", () => {
    expect(() =>
      calculateSajuData({ birthDate: "2000-08-15", birthTime: null, calendarType: "leap", gender: "M" }),
    ).toThrow(SajuInputError);
  });
});
