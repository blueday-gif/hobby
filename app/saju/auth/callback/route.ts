import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/saju/redirect";
import { createClient } from "@/lib/supabase/server";

/** 소셜 로그인 후 돌아오는 주소. 인증 코드를 세션으로 교환하고 `next`로 보낸다. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/saju/login?error=auth&next=${encodeURIComponent(next)}`);
}
