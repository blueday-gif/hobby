"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { MIN_PASSWORD_LENGTH } from "@/lib/saju/password-rules";
import { rememberPrivacyAgreed } from "@/lib/saju/storage";
import { signInWithEmail, signUpWithEmail } from "../actions";

type Provider = "kakao" | "google";
type EmailMode = "signin" | "signup";

const PROVIDER_LABEL: Record<Provider, string> = {
  google: "Google로 계속",
  kakao: "카카오로 계속",
};

const PRIVACY_REQUIRED = "개인정보 수집·이용에 동의해 주세요.";

export default function LoginButtons({ next, initialError }: { next: string; initialError?: string | null }) {
  const [mode, setMode] = useState<EmailMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const disabled = busy !== null || isPending;

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const requestedMode: EmailMode =
      submitter instanceof HTMLButtonElement ? (submitter.value === "signup" ? "signup" : "signin") : mode;

    setMode(requestedMode);
    setError(null);
    setNotice(null);

    if (requestedMode === "signup" && !consent) {
      setError(PRIVACY_REQUIRED);
      return;
    }
    if (!email.trim()) {
      setError("이메일 주소를 입력해 주세요.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`비밀번호는 ${MIN_PASSWORD_LENGTH}자리 이상이어야 해요.`);
      return;
    }

    // 로그인 직후 /result/migrate에서 개인정보 동의 여부를 서버 액션으로 넘길 수 있도록 기억해 둔다.
    if (requestedMode === "signup" && consent) rememberPrivacyAgreed();

    startTransition(async () => {
      // 성공하면 서버 액션이 redirect()로 다음 화면으로 보내므로 여기로 돌아오지 않는다.
      const outcome =
        requestedMode === "signup"
          ? await signUpWithEmail(email, password, next, consent)
          : await signInWithEmail(email, password, next);

      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      setNotice("가입을 시작했어요. 이메일로 보낸 인증 링크를 누르면 가입이 끝나요. 메일이 안 보이면 스팸함도 확인해 주세요.");
    });
  }

  async function handleSocialSignIn(provider: Provider) {
    setError(null);
    setNotice(null);
    if (!consent) {
      setError(PRIVACY_REQUIRED);
      return;
    }

    setBusy(provider);
    try {
      rememberPrivacyAgreed();
      const redirectTo = `${window.location.origin}/saju/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: signInError } = await createClient().auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (signInError) throw signInError;
      // 성공하면 브라우저가 소셜 로그인 페이지로 이동하므로 busy 상태를 유지한다.
    } catch {
      setError("로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setBusy(null);
    }
  }

  return (
    <div className="sj-login-methods">
      <form className="sj-form sj-login-form" onSubmit={handleEmailSubmit} noValidate>
        <div className="sj-field">
          <label className="sj-label" htmlFor="sj-email">
            이메일
          </label>
          <input
            id="sj-email"
            className="sj-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="sj-field">
          <label className="sj-label" htmlFor="sj-password">
            비밀번호
          </label>
          <input
            id="sj-password"
            className="sj-input"
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder={`${MIN_PASSWORD_LENGTH}자리 이상`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={disabled}
          />
          <label className="sj-check">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            <span>비밀번호 보기</span>
          </label>
          {mode === "signup" && (
            <span className="sj-hint">{MIN_PASSWORD_LENGTH}자리 이상으로 만들어 주세요. 영문·숫자를 섞으면 더 안전해요.</span>
          )}
        </div>

        <label className="sj-check sj-login-consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={disabled}
          />
          <span>
            (필수) 가입 또는 간편 로그인, 결과 저장을 위해 생년월일시와 성별을 수집·이용하는 데 동의합니다. 이메일 로그인에는 체크하지 않아도 돼요.
          </span>
        </label>

        {error && (
          <p className="sj-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="sj-ok" role="status">
            {notice}
          </p>
        )}

        <div className="sj-login-email-actions">
          <button type="submit" name="intent" value="signin" className="sj-btn sj-btn-ghost" disabled={disabled}>
            {isPending ? "처리 중..." : "로그인"}
          </button>
          <button type="submit" name="intent" value="signup" className="sj-btn" disabled={disabled}>
            {isPending ? "처리 중..." : "가입하기"}
          </button>
        </div>
      </form>

      <div className="sj-login-divider" aria-hidden="true">
        <span>또는 간편 로그인</span>
      </div>

      <div className="sj-login-social">
        {(["google", "kakao"] as const).map((provider) => (
          <button
            key={provider}
            type="button"
            className={`sj-login-social-btn sj-login-social-${provider}`}
            disabled={disabled}
            onClick={() => handleSocialSignIn(provider)}
          >
            <span className="sj-login-social-mark" aria-hidden="true">
              {provider === "google" ? "G" : "K"}
            </span>
            {busy === provider ? "로그인 페이지로 이동 중..." : PROVIDER_LABEL[provider]}
          </button>
        ))}
      </div>
    </div>
  );
}
