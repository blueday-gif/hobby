import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessionUser } from "@/lib/saju/data";
import { safeNext } from "@/lib/saju/redirect";
import LoginButtons from "../_components/login-buttons";

export const metadata: Metadata = { title: "로그인" };

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

async function LoginContent({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNext(params.next);

  // 이미 로그인했다면 로그인 화면을 건너뛴다.
  const { user } = await getSessionUser();
  if (user) redirect(next);

  const initialError = params.error ? "로그인하지 못했어요. 다시 시도해 주세요." : null;

  return (
    <section className="sj-card sj-login-card sj-stack">
      <div>
        <span className="sj-eyebrow">간단 가입·로그인</span>
        <h1>로그인하고 전체 순위 보기</h1>
        <p className="sj-lead">
          방금 확인한 결과는 로그인 후 자동으로 저장돼요. 12개 취미 전체 순위와 공유 링크도 함께 열려요.
        </p>
      </div>
      <LoginButtons next={next} initialError={initialError} />
    </section>
  );
}

export default function SajuLoginPage(props: LoginPageProps) {
  return (
    <Suspense fallback={<p className="sj-hint sj-center">불러오는 중이에요...</p>}>
      <LoginContent searchParams={props.searchParams} />
    </Suspense>
  );
}
