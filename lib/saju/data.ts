import "server-only";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BirthInput, CalendarType, CategoryType, GenderType } from "./types";

export type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ProfileRow {
  birth_date: string;
  birth_time: string | null;
  calendar_type: CalendarType;
  gender: GenderType;
}

export interface ResultRow {
  id: string;
  user_id: string;
  birth_date: string;
  birth_time: string | null;
  calendar_type: CalendarType;
  gender: GenderType;
  saju_palja: unknown;
  scores: unknown;
  top_category: CategoryType;
  top_hobby_id: string;
  stem_code: string;
  wellness_template_id: string;
  is_public: boolean;
  created_at: string;
}

export type ResultListRow = Pick<
  ResultRow,
  "id" | "created_at" | "top_category" | "top_hobby_id" | "stem_code" | "is_public"
>;

export interface SharedRow {
  id: string;
  scores: unknown;
  top_category: CategoryType;
  top_category_name: string;
  top_category_headline: string;
  top_hobby_id: string;
  top_hobby_name: string;
  top_hobby_short_copy: string;
  stem_code: string;
  stem_ko: string;
  stem_hanja: string;
  day_master_nickname: string;
  day_master_summary: string;
  created_at: string;
}

/** 현재 로그인한 사용자와 서버용 Supabase 클라이언트. 요청 쿠키를 읽으므로 Suspense 안에서 호출한다. */
export async function getSessionUser() {
  // 로그인 확인 과정(Supabase)에서 현재 시각(Date.now)을 쓰므로, 미리 만들어 두지 않고 접속 시점에 실행하도록 알린다.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getProfile(supabase: ServerSupabase, userId: string): Promise<ProfileRow | null> {
  const { data } = await supabase
    .from("profiles")
    .select("birth_date,birth_time,calendar_type,gender")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as ProfileRow | null) ?? null;
}

/** DB의 TIME('HH:MM:SS')을 폼에서 쓰는 'HH:mm'으로 맞춘다. */
export function profileToInput(row: ProfileRow): BirthInput {
  return {
    birthDate: row.birth_date,
    birthTime: row.birth_time ? row.birth_time.slice(0, 5) : null,
    calendarType: row.calendar_type,
    gender: row.gender,
  };
}

export async function getOwnResult(supabase: ServerSupabase, id: string): Promise<ResultRow | null> {
  if (!UUID_RE.test(id)) return null;
  const { data } = await supabase.from("results").select("*").eq("id", id).maybeSingle();
  return (data as ResultRow | null) ?? null;
}

export async function listOwnResults(supabase: ServerSupabase, userId: string): Promise<ResultListRow[]> {
  const { data } = await supabase
    .from("results")
    .select("id,created_at,top_category,top_hobby_id,stem_code,is_public")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as ResultListRow[] | null) ?? [];
}

/**
 * 공유 링크용 조회. 쿠키를 쓰지 않는 익명 클라이언트로 shared_results_view만 읽는다.
 * 공유 설정을 바꾸면 server action이 같은 태그를 갱신한다.
 */
export async function getSharedResult(id: string): Promise<SharedRow | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 600 });
  cacheTag(`shared:${id}`);

  if (!UUID_RE.test(id)) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const client = createAnonClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await client.from("shared_results_view").select("*").eq("id", id).maybeSingle();
  return (data as SharedRow | null) ?? null;
}
