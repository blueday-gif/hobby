import { calculateSaju, lunarToSolar, solarToLunar } from "@fullstackfamily/manseryeok";
import type { BirthInput, Pillar, SajuData } from "./types";

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2050;
/** 한국 표준 경도(서울). 진태양시 보정에 사용한다. */
const SEOUL_LONGITUDE = 127;

export class SajuInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SajuInputError";
  }
}

function parseDateParts(birthDate: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function parseTimeParts(birthTime: string): { hour: number; minute: number } | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(birthTime);
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

/** 입력값 검증. 문제가 없으면 null, 있으면 사용자에게 보여줄 한국어 메시지를 반환한다. */
export function validateBirthInput(input: BirthInput): string | null {
  const parts = parseDateParts(input.birthDate);
  if (!parts) return "생년월일을 YYYY-MM-DD 형식으로 입력해 주세요.";
  if (parts.y < MIN_YEAR || parts.y > MAX_YEAR) {
    return `${MIN_YEAR}년~${MAX_YEAR}년 사이의 생년월일만 계산할 수 있어요.`;
  }
  if (parts.m < 1 || parts.m > 12 || parts.d < 1 || parts.d > 31) {
    return "존재하지 않는 날짜예요. 다시 확인해 주세요.";
  }
  if (input.calendarType === "solar") {
    const probe = new Date(Date.UTC(parts.y, parts.m - 1, parts.d));
    if (
      probe.getUTCFullYear() !== parts.y ||
      probe.getUTCMonth() !== parts.m - 1 ||
      probe.getUTCDate() !== parts.d
    ) {
      return "존재하지 않는 날짜예요. 다시 확인해 주세요.";
    }
    if (probe.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      return "미래 날짜는 입력할 수 없어요.";
    }
  } else if (parts.d > 30) {
    return "음력은 한 달이 최대 30일이에요.";
  }
  if (input.birthTime !== null && !parseTimeParts(input.birthTime)) {
    return "출생 시간을 HH:mm 형식으로 입력해 주세요.";
  }
  if (!["solar", "lunar", "leap"].includes(input.calendarType)) {
    return "달력 유형을 선택해 주세요.";
  }
  if (!["M", "F"].includes(input.gender)) {
    return "성별을 선택해 주세요.";
  }
  return null;
}

function toPillar(value: string | null): Pillar | null {
  if (value === null) return null;
  const chars = Array.from(value);
  if (chars.length !== 2) {
    throw new SajuInputError("사주 기둥을 해석하지 못했어요.");
  }
  return { stem: chars[0], branch: chars[1] };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 음력 → 양력 변환.
 *
 * 만세력 라이브러리의 lunarToSolar는 일부 음력 날짜(주로 음력 11~12월처럼 양력으로는 이듬해에 걸치는 날짜)에서
 * 실제로 존재하는 날짜인데도 InvalidDateError를 낸다. 반대 방향 변환(solarToLunar)은 정상이므로,
 * 실패하면 해당 음력 해가 시작되는 무렵부터 양력 날짜를 하루씩 훑어 같은 음력 날짜를 찾는다.
 * 그래도 못 찾으면 진짜로 없는 날짜(예: 29일까지인 달의 30일, 윤달이 없는 해의 윤달)다.
 */
function convertLunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeapMonth: boolean,
): { year: number; month: number; day: number } {
  try {
    return lunarToSolar(year, month, day, isLeapMonth).solar;
  } catch (error) {
    if (!(error instanceof Error) || error.name !== "InvalidDateError") throw error;
  }

  const first = Date.UTC(year, 0, 15);
  for (let i = 0; i <= 440; i += 1) {
    const date = new Date(first + i * DAY_MS);
    const solar = { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
    let lunar;
    try {
      lunar = solarToLunar(solar.year, solar.month, solar.day).lunar;
    } catch {
      continue; // 라이브러리 지원 범위 밖(1900년 1월 초 등)
    }
    if (lunar.year > year) break;
    if (
      lunar.year === year &&
      lunar.month === month &&
      lunar.day === day &&
      lunar.isLeapMonth === isLeapMonth
    ) {
      return solar;
    }
  }

  const invalid = new Error(`Invalid lunar date: ${year}-${month}-${day}`);
  invalid.name = "InvalidDateError";
  throw invalid;
}

/**
 * 생년월일시 입력 → 사주(년·월·일·시주) 계산.
 * 음력 입력은 양력으로 바꾼 뒤, 시간은 서울 경도 기준 진태양시로 보정해 계산한다.
 */
export function calculateSajuData(input: BirthInput): SajuData {
  const problem = validateBirthInput(input);
  if (problem) throw new SajuInputError(problem);

  const parts = parseDateParts(input.birthDate)!;
  let { y, m, d } = parts;

  try {
    if (input.calendarType !== "solar") {
      const converted = convertLunarToSolar(y, m, d, input.calendarType === "leap");
      y = converted.year;
      m = converted.month;
      d = converted.day;
    }

    const time = input.birthTime === null ? null : parseTimeParts(input.birthTime);
    const result = time
      ? calculateSaju(y, m, d, time.hour, time.minute, {
          longitude: SEOUL_LONGITUDE,
          applyTimeCorrection: true,
        })
      : calculateSaju(y, m, d);

    const year = toPillar(result.yearPillar);
    const month = toPillar(result.monthPillar);
    const day = toPillar(result.dayPillar);
    if (!year || !month || !day) throw new SajuInputError("사주를 계산하지 못했어요.");

    return { year, month, day, hour: time ? toPillar(result.hourPillar) : null };
  } catch (error) {
    if (error instanceof SajuInputError) throw error;
    const name = error instanceof Error ? error.name : "";
    if (name === "OutOfRangeError") {
      throw new SajuInputError(`${MIN_YEAR}년~${MAX_YEAR}년 사이의 생년월일만 계산할 수 있어요.`);
    }
    if (name === "InvalidDateError") {
      throw new SajuInputError("존재하지 않는 날짜예요. 윤달 여부와 날짜를 다시 확인해 주세요.");
    }
    throw new SajuInputError("사주를 계산하는 중 문제가 생겼어요. 입력값을 다시 확인해 주세요.");
  }
}
