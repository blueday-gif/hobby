"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { parsePending, readPendingRaw, subscribePending } from "@/lib/saju/storage";
import ResultView from "./result-view";

const subscribeNothing = () => () => {};

/**
 * 비회원 결과 화면. 결과는 서버에 없고 브라우저(localStorage)에만 있으므로 클라이언트에서 읽는다.
 * 서버 렌더링 때는 저장소를 읽을 수 없어 '불러오는 중' 상태로 시작한다.
 */
export default function GuestResult() {
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const raw = useSyncExternalStore(subscribePending, readPendingRaw, () => null);
  const pending = useMemo(() => parsePending(raw), [raw]);

  if (!hydrated) {
    return <p className="sj-hint sj-center">결과를 불러오는 중이에요...</p>;
  }

  if (!pending) {
    return (
      <section className="sj-card sj-empty">
        <h2>보여드릴 결과가 없어요</h2>
        <p>임시 결과는 이 브라우저에 24시간 동안만 보관돼요. 생년월일시를 다시 입력해 주세요.</p>
        <div className="sj-actions">
          <Link href="/saju/input" className="sj-btn">
            다시 입력하기
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="sj-stack">
      <p className="sj-banner" role="status">
        현재 결과는 저장되지 않았어요. 이 브라우저에 24시간 동안만 임시 보관돼요.
      </p>
      <ResultView
        data={pending.result}
        mode="guest"
        lockedCta={
          <div className="sj-stack sj-center">
            <b>로그인하면 12개 취미 전체 순위를 볼 수 있어요</b>
            <span className="sj-hint">결과 저장과 공유 링크도 함께 열려요.</span>
            <Link href="/saju/login" className="sj-btn">
              로그인하고 전체 순위 확인·저장하기
            </Link>
          </div>
        }
      />
      <div className="sj-actions">
        <Link href="/saju/input" className="sj-btn sj-btn-ghost">
          다시 입력하기
        </Link>
      </div>
    </div>
  );
}
