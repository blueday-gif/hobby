"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { calculateSajuData, MAX_YEAR, MIN_YEAR, SajuInputError, validateBirthInput } from "@/lib/saju/calculator";
import { judge } from "@/lib/saju/judge";
import { savePending } from "@/lib/saju/storage";
import type { BirthInput, CalendarType, GenderType } from "@/lib/saju/types";
import { saveResult, updateProfile } from "../actions";

/** 12시진. 대표 시각은 시진 구간의 가운데(표준시 기준)로, 진태양시 보정 후에도 같은 시진에 들어간다. */
const SIJIN = [
  { label: "자시 (23:30~01:29)", time: "00:30" },
  { label: "축시 (01:30~03:29)", time: "02:30" },
  { label: "인시 (03:30~05:29)", time: "04:30" },
  { label: "묘시 (05:30~07:29)", time: "06:30" },
  { label: "진시 (07:30~09:29)", time: "08:30" },
  { label: "사시 (09:30~11:29)", time: "10:30" },
  { label: "오시 (11:30~13:29)", time: "12:30" },
  { label: "미시 (13:30~15:29)", time: "14:30" },
  { label: "신시 (15:30~17:29)", time: "16:30" },
  { label: "유시 (17:30~19:29)", time: "18:30" },
  { label: "술시 (19:30~21:29)", time: "20:30" },
  { label: "해시 (21:30~23:29)", time: "22:30" },
] as const;

type TimeMode = "exact" | "sijin" | "unknown";

const LATEST_YEAR = Math.min(MAX_YEAR, new Date().getFullYear());
const YEARS = Array.from({ length: LATEST_YEAR - MIN_YEAR + 1 }, (_, i) => LATEST_YEAR - i);
const pad = (value: number | string) => String(value).padStart(2, "0");

interface InputFormProps {
  /** result: 결과 계산, profile: 마이페이지 프로필 저장 */
  mode: "result" | "profile";
  isMember: boolean;
  /** 로그인했지만 아직 프로필(개인정보 동의)이 없는 경우 true */
  needsConsent: boolean;
  initial?: BirthInput | null;
}

export default function InputForm({ mode, isMember, needsConsent, initial }: InputFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [datePart] = useState(() => (initial ? initial.birthDate.split("-") : ["", "", ""]));
  const [year, setYear] = useState(datePart[0] ?? "");
  const [month, setMonth] = useState(datePart[1] ? String(Number(datePart[1])) : "");
  const [day, setDay] = useState(datePart[2] ? String(Number(datePart[2])) : "");
  const [calendarType, setCalendarType] = useState<CalendarType>(initial?.calendarType ?? "solar");
  const [timeMode, setTimeMode] = useState<TimeMode>(initial ? (initial.birthTime ? "exact" : "unknown") : "exact");
  const [exactTime, setExactTime] = useState(initial?.birthTime ?? "");
  const [sijinIndex, setSijinIndex] = useState("");
  const [gender, setGender] = useState<GenderType | "">(initial?.gender ?? "");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const maxDay = calendarType === "solar" ? 31 : 30;
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  function buildInput(): BirthInput | string {
    if (!year || !month || !day) return "생년월일을 모두 선택해 주세요.";
    if (!gender) return "성별을 선택해 주세요.";

    let birthTime: string | null = null;
    if (timeMode === "exact") {
      if (!exactTime) return "출생 시각을 입력하거나 '시간 모름'을 선택해 주세요.";
      birthTime = exactTime;
    } else if (timeMode === "sijin") {
      if (sijinIndex === "") return "출생 시진을 선택하거나 '시간 모름'을 선택해 주세요.";
      birthTime = SIJIN[Number(sijinIndex)].time;
    }

    return {
      birthDate: `${year}-${pad(month)}-${pad(day)}`,
      birthTime,
      calendarType,
      gender,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const built = buildInput();
    if (typeof built === "string") {
      setError(built);
      return;
    }
    const problem = validateBirthInput(built);
    if (problem) {
      setError(problem);
      return;
    }
    if (isMember && needsConsent && !consent) {
      setError("개인정보 수집·이용에 동의해 주세요.");
      return;
    }

    if (mode === "profile") {
      startTransition(async () => {
        const outcome = await updateProfile(built, { privacyAgreed: consent });
        if (!outcome.ok) {
          setError(outcome.error);
          return;
        }
        setSaved(true);
        router.refresh();
      });
      return;
    }

    if (isMember) {
      startTransition(async () => {
        const outcome = await saveResult(built, { privacyAgreed: consent });
        if (!outcome.ok) {
          setError(outcome.error);
          return;
        }
        router.push(`/saju/result/${outcome.id}`);
      });
      return;
    }

    // 비회원: 브라우저에서 바로 계산하고 로그인 후 이월할 수 있도록 임시 보관한다.
    try {
      const result = judge(calculateSajuData(built));
      savePending(built, result);
      router.push("/saju/result");
    } catch (caught) {
      setError(caught instanceof SajuInputError ? caught.message : "계산 중 문제가 생겼어요. 입력값을 확인해 주세요.");
    }
  }

  return (
    <form className="sj-form" onSubmit={handleSubmit} noValidate>
      <div className="sj-field">
        <span className="sj-label">달력 유형</span>
        <div className="sj-seg" role="radiogroup" aria-label="달력 유형">
          {(
            [
              ["solar", "양력"],
              ["lunar", "음력(평달)"],
              ["leap", "음력(윤달)"],
            ] as const
          ).map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="calendarType"
                value={value}
                checked={calendarType === value}
                onChange={() => {
                  setCalendarType(value);
                  if (value !== "solar" && day === "31") setDay("");
                }}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="sj-field">
        <span className="sj-label">생년월일</span>
        <div className="sj-row">
          <select className="sj-select" aria-label="출생 연도" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">연도</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
          <select className="sj-select" aria-label="출생 월" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">월</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}월
              </option>
            ))}
          </select>
          <select className="sj-select" aria-label="출생 일" value={day} onChange={(e) => setDay(e.target.value)}>
            <option value="">일</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}일
              </option>
            ))}
          </select>
        </div>
        <span className="sj-hint">{MIN_YEAR}년~{MAX_YEAR}년 사이의 날짜를 계산할 수 있어요.</span>
      </div>

      <div className="sj-field">
        <span className="sj-label">태어난 시간</span>
        <div className="sj-seg" role="radiogroup" aria-label="출생 시간 입력 방식">
          {(
            [
              ["exact", "정확한 시각"],
              ["sijin", "12시진 선택"],
              ["unknown", "시간 모름"],
            ] as const
          ).map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="timeMode"
                value={value}
                checked={timeMode === value}
                onChange={() => setTimeMode(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        {timeMode === "exact" && (
          <input
            className="sj-input"
            type="time"
            aria-label="출생 시각"
            value={exactTime}
            onChange={(e) => setExactTime(e.target.value)}
          />
        )}
        {timeMode === "sijin" && (
          <select
            className="sj-select"
            aria-label="출생 시진"
            value={sijinIndex}
            onChange={(e) => setSijinIndex(e.target.value)}
          >
            <option value="">시진을 선택해 주세요</option>
            {SIJIN.map((item, index) => (
              <option key={item.label} value={index}>
                {item.label}
              </option>
            ))}
          </select>
        )}
        <span className="sj-hint">
          {timeMode === "unknown"
            ? "시간을 모르면 년·월·일 세 기둥(6글자)으로 계산해요."
            : "서울 기준 진태양시로 보정해 시주를 계산해요."}
        </span>
      </div>

      <div className="sj-field">
        <span className="sj-label">성별</span>
        <div className="sj-seg" role="radiogroup" aria-label="성별">
          {(
            [
              ["M", "남"],
              ["F", "여"],
            ] as const
          ).map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="gender"
                value={value}
                checked={gender === value}
                onChange={() => setGender(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {isMember && needsConsent && (
        <label className="sj-check">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            (필수) 결과를 저장·재조회하기 위해 생년월일시와 성별을 수집·이용하는 것에 동의합니다. 마이페이지에서 언제든
            수정·삭제할 수 있어요.
          </span>
        </label>
      )}

      {error && (
        <p className="sj-error" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="sj-ok" role="status">
          프로필을 저장했어요.
        </p>
      )}

      <div className="sj-actions">
        <button type="submit" className="sj-btn" disabled={isPending}>
          {isPending ? "처리 중..." : mode === "profile" ? "프로필 저장" : "내 취미 찾기"}
        </button>
      </div>
      {mode === "result" && !isMember && (
        <p className="sj-hint">로그인 없이 바로 결과를 볼 수 있어요. 결과는 이 브라우저에만 임시 보관돼요.</p>
      )}
    </form>
  );
}
