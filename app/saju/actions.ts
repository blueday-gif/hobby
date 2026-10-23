"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateSajuData, SajuInputError, validateBirthInput } from "@/lib/saju/calculator";
import { UUID_RE } from "@/lib/saju/data";
import { judge } from "@/lib/saju/judge";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/saju/password-rules";
import { safeNext } from "@/lib/saju/redirect";
import { toStoredPalja, toStoredScores } from "@/lib/saju/result-store";
import type { BirthInput } from "@/lib/saju/types";

export type ActionOutcome = { ok: true } | { ok: false; error: string };
export type SaveResultOutcome = { ok: true; id: string } | { ok: false; error: string };

const NOT_SIGNED_IN = "로그인이 필요해요. 다시 로그인해 주세요.";
const PRIVACY_REQUIRED = "개인정보 수집·이용에 동의해 주세요.";

/** 서버 액션은 클라이언트가 보낸 값을 그대로 받으므로, 형태부터 확인한다. */
function normalizeInput(raw: unknown): BirthInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.birthDate !== "string") return null;
  if (v.birthTime !== null && typeof v.birthTime !== "string") return null;
  if (v.calendarType !== "solar" && v.calendarType !== "lunar" && v.calendarType !== "leap") return null;
  if (v.gender !== "M" && v.gender !== "F") return null;
  return {
    birthDate: v.birthDate,
    birthTime: v.birthTime as string | null,
    calendarType: v.calendarType,
    gender: v.gender,
  };
}

async function upsertProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  input: BirthInput,
  privacyAgreed: boolean,
): Promise<ActionOutcome> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  // 프로필이 처음 만들어질 때만 개인정보 동의를 요구한다.
  if (!existing && !privacyAgreed) return { ok: false, error: PRIVACY_REQUIRED };

  const now = new Date().toISOString();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      birth_date: input.birthDate,
      birth_time: input.birthTime,
      calendar_type: input.calendarType,
      gender: input.gender,
      ...(existing ? {} : { privacy_agreed: true, privacy_agreed_at: now }),
      updated_at: now,
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, error: "프로필을 저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  return { ok: true };
}

/**
 * 판정 결과를 저장한다. 클라이언트가 계산한 결과는 믿지 않고,
 * 입력값으로 서버에서 다시 판정한다(judge는 결정론적 순수 함수).
 */
export async function saveResult(
  rawInput: unknown,
  options?: { privacyAgreed?: boolean },
): Promise<SaveResultOutcome> {
  const input = normalizeInput(rawInput);
  if (!input) return { ok: false, error: "입력값을 확인해 주세요." };

  let result;
  try {
    result = judge(calculateSajuData(input));
  } catch (error) {
    return {
      ok: false,
      error: error instanceof SajuInputError ? error.message : "사주를 계산하지 못했어요.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const profile = await upsertProfile(supabase, user.id, input, options?.privacyAgreed === true);
  if (!profile.ok) return profile;

  const { data, error } = await supabase
    .from("results")
    .insert({
      user_id: user.id,
      birth_date: input.birthDate,
      birth_time: input.birthTime,
      calendar_type: input.calendarType,
      gender: input.gender,
      saju_palja: toStoredPalja(result),
      scores: toStoredScores(result),
      top_category: result.topCategory.category,
      top_hobby_id: result.topHobby.hobbyId,
      stem_code: result.dayMaster.stemCode,
      wellness_template_id: result.wellness.primary.templateId,
      is_public: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "결과를 저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
  return { ok: true, id: (data as { id: string }).id };
}

/** 마이페이지에서 기본 생년월일시 프로필을 수정한다. */
export async function updateProfile(
  rawInput: unknown,
  options?: { privacyAgreed?: boolean },
): Promise<ActionOutcome> {
  const input = normalizeInput(rawInput);
  if (!input) return { ok: false, error: "입력값을 확인해 주세요." };
  const problem = validateBirthInput(input);
  if (problem) return { ok: false, error: problem };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  return upsertProfile(supabase, user.id, input, options?.privacyAgreed === true);
}

/** 공유 링크를 켜거나 끈다. 공유 뷰에는 생년월일시가 포함되지 않는다. */
export async function setResultPublic(id: string, isPublic: boolean): Promise<ActionOutcome> {
  if (!UUID_RE.test(id)) return { ok: false, error: "결과를 찾을 수 없어요." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { data, error } = await supabase
    .from("results")
    .update({ is_public: isPublic })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");
  if (error || !data || data.length === 0) {
    return { ok: false, error: "공유 설정을 바꾸지 못했어요." };
  }

  updateTag(`shared:${id}`);
  return { ok: true };
}

export async function deleteResult(id: string): Promise<ActionOutcome> {
  if (!UUID_RE.test(id)) return { ok: false, error: "결과를 찾을 수 없어요." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { error } = await supabase.from("results").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, error: "결과를 삭제하지 못했어요." };

  updateTag(`shared:${id}`);
  return { ok: true };
}

export async function signOutSaju() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/saju");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailAuthOutcome =
  | { ok: false; error: string }
  | { ok: true; needsEmailConfirm: true };

function checkEmailAndPassword(email: unknown, password: unknown): { email: string; password: string } | string {
  if (typeof email !== "string" || typeof password !== "string") return "이메일과 비밀번호를 입력해 주세요.";
  const trimmed = email.trim();
  if (!EMAIL_RE.test(trimmed)) return "이메일 주소 형식을 확인해 주세요.";
  if (password.length < MIN_PASSWORD_LENGTH) return `비밀번호는 ${MIN_PASSWORD_LENGTH}자리 이상이어야 해요.`;
  if (password.length > MAX_PASSWORD_LENGTH) return `비밀번호는 ${MAX_PASSWORD_LENGTH}자 이하로 입력해 주세요.`;
  return { email: trimmed, password };
}

/**
 * 이메일·비밀번호로 가입한다. 대시보드의 Confirm email이 꺼져 있으면 가입과 동시에 로그인되어 바로 이동하고,
 * 켜져 있으면 세션이 없으므로 인증 메일 안내 결과를 돌려준다.
 */
export async function signUpWithEmail(
  email: unknown,
  password: unknown,
  next: unknown,
  privacyAgreed: unknown,
): Promise<EmailAuthOutcome> {
  if (privacyAgreed !== true) return { ok: false, error: PRIVACY_REQUIRED };
  const checked = checkEmailAndPassword(email, password);
  if (typeof checked === "string") return { ok: false, error: checked };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email: checked.email, password: checked.password });

  if (error) {
    if (error.code === "user_already_exists") {
      return { ok: false, error: "이미 가입된 이메일이에요. '로그인' 탭에서 로그인해 주세요." };
    }
    if (error.code === "weak_password") {
      return { ok: false, error: `비밀번호는 ${MIN_PASSWORD_LENGTH}자리 이상으로 더 안전하게 만들어 주세요.` };
    }
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return { ok: false, error: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요." };
    }
    if (error.code === "email_address_invalid") {
      return { ok: false, error: "사용할 수 없는 이메일 주소예요. 다른 주소로 시도해 주세요." };
    }
    return { ok: false, error: "가입하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }

  // Confirm email이 켜져 있으면 세션이 없다.
  if (!data.session) return { ok: true, needsEmailConfirm: true };

  redirect(safeNext(typeof next === "string" ? next : null));
}

/** 이메일·비밀번호로 로그인하고 `next`로 이동한다. */
export async function signInWithEmail(
  email: unknown,
  password: unknown,
  next: unknown,
): Promise<EmailAuthOutcome> {
  const checked = checkEmailAndPassword(email, password);
  if (typeof checked === "string") return { ok: false, error: checked };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: checked.email, password: checked.password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { ok: false, error: "이메일 인증이 아직 끝나지 않았어요. 받은 메일함의 인증 링크를 눌러 주세요." };
    }
    if (error.status === 429) {
      return { ok: false, error: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요." };
    }
    return { ok: false, error: "이메일 또는 비밀번호가 맞지 않아요." };
  }

  redirect(safeNext(typeof next === "string" ? next : null));
}
