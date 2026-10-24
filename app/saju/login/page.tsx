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
    <div className="sj-login-layout">
      <section className="sj-login-story">
        <span className="sj-login-badge">
          <span className="sj-login-badge-dot" aria-hidden="true" />
          나를 알아가는 새로운 방법
        </span>
        <h1>
          나에게 맞는 취미,
          <br />
          <em>사주로 발견해요</em>
        </h1>
        <p className="sj-login-story-copy">
          로그인하면 방금 확인한 결과를 안전하게 저장하고, 12개 취미 순위와 나만의 공유 링크를 언제든 다시 볼 수 있어요.
        </p>

        <div className="sj-login-art" aria-hidden="true">
          <div className="sj-login-art-ring">
            <span className="sj-login-element sj-login-element-wood">목</span>
            <span className="sj-login-element sj-login-element-fire">화</span>
            <span className="sj-login-element sj-login-element-earth">토</span>
            <span className="sj-login-element sj-login-element-metal">금</span>
            <span className="sj-login-element sj-login-element-water">수</span>
            <div className="sj-login-art-center">
              <span>나만의</span>
              <b>취미 찾기</b>
            </div>
          </div>
        </div>

        <div className="sj-login-benefits">
          <span><i aria-hidden="true">01</i> 전체 취미 순위 확인</span>
          <span><i aria-hidden="true">02</i> 내 결과 저장 및 다시 보기</span>
          <span><i aria-hidden="true">03</i> 친구와 결과 공유</span>
        </div>
      </section>

      <section className="sj-card sj-login-card">
        <div className="sj-login-card-heading">
          <span className="sj-eyebrow">SAJU HOBBY</span>
          <h2>간편하게 시작하기</h2>
          <p>원하는 방법으로 로그인하거나 가입해 주세요.</p>
        </div>
        <LoginButtons next={next} initialError={initialError} />
        <p className="sj-login-footnote">이메일 로그인은 이미 가입한 계정에 사용할 수 있어요.</p>
      </section>
    </div>
  );
}

export default function SajuLoginPage(props: LoginPageProps) {
  return (
    <Suspense fallback={<p className="sj-hint sj-center">불러오는 중이에요...</p>}>
      <LoginContent searchParams={props.searchParams} />
    </Suspense>
  );
}
