"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { MIN_PASSWORD_LENGTH } from "@/lib/saju/password-rules";
import { rememberPrivacyAgreed } from "@/lib/saju/storage";
import { signInWithEmail, signUpWithEmail } from "../actions";

type Provider = "kakao" | "google";
type EmailMode = "signin" | "signup";

const PROVIDER_LABEL: Record<Provider, string> = {
  kakao: "카카오로 시작하기",
  google: "Google로 시작하기",
};

const PRIVACY_REQUIRED = "개인정보 수집·이용에 동의해 주세요.";

export default function LoginButtons({ next, initialError }: { next: string; initialError?: string | null }) {
  const [mode, setMode] = useState<EmailMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const disabled = busy !== null || isPending;

  function changeMode(value: EmailMode) {
    setMode(value);
    setError(null);
    setNotice(null);
  }

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (mode === "signup" && !consent) {
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
    if (consent) rememberPrivacyAgreed();

    startTransition(async () => {
      // 성공하면 서버 액션이 redirect()로 다음 화면으로 보내므로 여기로 돌아오지 않는다.
      const outcome =
        mode === "signup"
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
    <div className="sj-stack">
      <div className="sj-seg" role="radiogroup" aria-label="이메일 로그인 방식">
        {(
          [
            ["signup", "이메일로 가입"],
            ["signin", "이메일로 로그인"],
          ] as const
        ).map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name="emailMode"
              value={value}
              checked={mode === value}
              onChange={() => changeMode(value)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <form className="sj-form" style={{ gap: 14 }} onSubmit={handleEmailSubmit} noValidate>
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
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          />
          <label className="sj-check">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            <span>비밀번호 보기</span>
          </label>
          {mode === "signup" && (
            <span className="sj-hint">{MIN_PASSWORD_LENGTH}자리 이상으로 만들어 주세요. 영문·숫자를 섞으면 더 안전해요.</span>
          )}
        </div>

        <label className="sj-check">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            (필수) 결과를 저장·재조회하기 위해 생년월일시와 성별을 수집·이용하는 것에 동의합니다. 마이페이지에서 언제든
            수정·삭제할 수 있어요.
            {mode === "signin" && " (이미 가입한 계정으로 이메일 로그인할 때는 체크하지 않아도 돼요.)"}
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

        <button type="submit" className="sj-btn" disabled={disabled}>
          {isPending ? "처리 중..." : mode === "signup" ? "가입하기" : "로그인"}
        </button>
      </form>

      <p className="sj-hint sj-center" style={{ padding: 0 }}>
        또는
      </p>

      <div className="sj-stack" style={{ gap: 10 }}>
        {(["kakao", "google"] as const).map((provider) => (
          <button
            key={provider}
            type="button"
            className={`sj-btn sj-btn-${provider}`}
            disabled={disabled}
            onClick={() => handleSocialSignIn(provider)}
          >
            {busy === provider ? "이동 중..." : PROVIDER_LABEL[provider]}
          </button>
        ))}
      </div>
    </div>
  );
}
