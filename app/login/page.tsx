import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signIn } from "./actions";
import "./login.css";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: membership } = await supabase
      .from("facility_members")
      .select("facility_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (membership) redirect("/");
  }

  const { error } = await searchParams;

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <Link className="login-brand" href="/" aria-label="시설ON 홈">
          <span className="login-brand-mark"><i /><i /><i /><i /></span>
          <span><strong>시설ON</strong><small>FACILITY PORTAL</small></span>
        </Link>
        <div className="login-heading">
          <span className="login-kicker">FACILITY MANAGEMENT</span>
          <h1 id="login-title">로그인</h1>
          <p>등록된 계정으로 시설관리 포털에 접속하세요.</p>
        </div>
        {error && <p className="login-error" role="alert">
          {error === "missing"
            ? "이메일과 비밀번호를 입력해 주세요."
            : error === "membership"
              ? "계정에 시설 접근 권한이 없습니다. 관리자가 시설 멤버로 등록했는지 확인해 주세요."
              : "로그인 정보를 확인해 주세요."}
        </p>}
        <form action={signIn} className="login-form">
          <label htmlFor="email">이메일</label>
          <input id="email" name="email" type="email" autoComplete="username" required placeholder="name@example.com" />
          <label htmlFor="password">비밀번호</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required placeholder="비밀번호 입력" />
          <button type="submit">로그인</button>
        </form>
        <p className="login-help">테스트 계정은 Supabase 대시보드에서 등록할 수 있습니다.</p>
      </section>
    </main>
  );
}
