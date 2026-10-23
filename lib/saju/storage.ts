import type { BirthInput, JudgeResult } from "./types";

/** 비회원 판정 결과를 로그인 이후 DB로 옮기기 위한 임시 보관소(localStorage) */
export const PENDING_KEY = "saju_pending_result";
export const PRIVACY_AGREED_KEY = "saju_privacy_agreed";
const TTL_MS = 24 * 60 * 60 * 1000;
const CHANGE_EVENT = "saju-pending-change";

export interface PendingResult {
  input: BirthInput;
  result: JudgeResult;
  expiresAt: number;
}

export function savePending(input: BirthInput, result: JudgeResult): void {
  try {
    const payload: PendingResult = { input, result, expiresAt: Date.now() + TTL_MS };
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 조용히 넘어간다.
  }
}

export function clearPending(): void {
  try {
    window.localStorage.removeItem(PENDING_KEY);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // 무시
  }
}

/** useSyncExternalStore용: 저장된 원문 문자열을 그대로 돌려준다(참조 안정성). */
export function readPendingRaw(): string | null {
  try {
    return window.localStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
}

export function subscribePending(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function parsePending(raw: string | null): PendingResult | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingResult>;
    if (!parsed.input || !parsed.result || typeof parsed.expiresAt !== "number") return null;
    if (parsed.expiresAt < Date.now()) return null;
    return parsed as PendingResult;
  } catch {
    return null;
  }
}

export function loadPending(): PendingResult | null {
  return parsePending(readPendingRaw());
}

export function rememberPrivacyAgreed(): void {
  try {
    window.localStorage.setItem(PRIVACY_AGREED_KEY, "1");
  } catch {
    // 무시
  }
}

export function readPrivacyAgreed(): boolean {
  try {
    return window.localStorage.getItem(PRIVACY_AGREED_KEY) === "1";
  } catch {
    return false;
  }
}
