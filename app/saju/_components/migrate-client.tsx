"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearPending, loadPending, readPrivacyAgreed } from "@/lib/saju/storage";
import { saveResult, type SaveResultOutcome } from "../actions";

/**
 * 로그인 직후 비회원 임시 결과(localStorage)를 DB에 저장하고 결과 상세로 이동한다.
 * 저장은 서버 액션이 입력값으로 결과를 다시 계산해 수행한다.
 */
export default function MigrateClient() {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [retrying, setRetrying] = useState(false);

  function finish(outcome: SaveResultOutcome) {
    if (!outcome.ok) {
      setError(outcome.error);
      setRetrying(false);
      return;
    }
    clearPending();
    router.replace(`/saju/result/${outcome.id}`);
  }

  useEffect(() => {
    // 개발 모드(StrictMode)에서 효과가 두 번 실행돼도 결과가 중복 저장되지 않게 한다.
    if (started.current) return;
    started.current = true;

    const pending = loadPending();
    if (!pending) {
      router.replace("/saju/mypage");
      return;
    }
    saveResult(pending.input, { privacyAgreed: readPrivacyAgreed() }).then(finish);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRetry() {
    const pending = loadPending();
    if (!pending) {
      router.replace("/saju/mypage");
      return;
    }
    setError(null);
    setRetrying(true);
    saveResult(pending.input, { privacyAgreed: consent || readPrivacyAgreed() }).then(finish);
  }

  if (!error) {
    return (
      <section className="sj-card sj-center sj-stack">
        <span className="sj-spinner" aria-hidden="true" />
        <h2>결과를 저장하고 있어요</h2>
        <p className="sj-hint">잠시만 기다려 주세요. 곧 전체 순위 화면으로 이동해요.</p>
      </section>
    );
  }

  return (
    <section className="sj-card sj-stack">
      <h2>결과를 저장하지 못했어요</h2>
      <p className="sj-error" role="alert">
        {error}
      </p>
      <label className="sj-check">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>(필수) 결과를 저장·재조회하기 위해 생년월일시와 성별을 수집·이용하는 것에 동의합니다.</span>
      </label>
      <div className="sj-actions">
        <button type="button" className="sj-btn" disabled={retrying} onClick={handleRetry}>
          {retrying ? "저장 중..." : "다시 시도"}
        </button>
        <Link href="/saju/input" className="sj-btn sj-btn-ghost">
          처음부터 다시 입력
        </Link>
      </div>
    </section>
  );
}
