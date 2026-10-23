"use client";

import { useState, useTransition } from "react";
import { setResultPublic } from "../actions";

type Message = { type: "ok" | "error"; text: string } | null;

/** 공유 링크를 켜고 끄고, 주소를 복사한다. 공유 페이지에는 생년월일시가 나오지 않는다. */
export default function ShareControls({ id, initialPublic }: { id: string; initialPublic: boolean }) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [message, setMessage] = useState<Message>(null);
  const [isPending, startTransition] = useTransition();
  const path = `/saju/share/${id}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setMessage({ type: "ok", text: "공유 링크를 복사했어요." });
    } catch {
      setMessage({ type: "error", text: "자동 복사에 실패했어요. [링크 복사] 버튼을 다시 눌러 주세요." });
    }
  }

  function toggle(next: boolean) {
    setMessage(null);
    startTransition(async () => {
      const outcome = await setResultPublic(id, next);
      if (!outcome.ok) {
        setMessage({ type: "error", text: outcome.error });
        return;
      }
      setIsPublic(next);
      if (next) {
        await copyLink();
      } else {
        setMessage({ type: "ok", text: "공유를 껐어요. 이전에 보낸 링크는 더 이상 열리지 않아요." });
      }
    });
  }

  return (
    <div className="sj-stack" style={{ gap: 10 }}>
      <div className="sj-actions">
        {isPublic ? (
          <>
            <button type="button" className="sj-btn" onClick={copyLink}>
              링크 복사
            </button>
            <button type="button" className="sj-btn sj-btn-ghost" disabled={isPending} onClick={() => toggle(false)}>
              {isPending ? "처리 중..." : "공유 끄기"}
            </button>
          </>
        ) : (
          <button type="button" className="sj-btn" disabled={isPending} onClick={() => toggle(true)}>
            {isPending ? "처리 중..." : "공유 링크 만들기"}
          </button>
        )}
      </div>
      <span className="sj-hint">
        {isPublic
          ? `공유 중이에요. 링크를 받은 사람은 ${path} 에서 캐릭터·웰니스·취미 결과만 볼 수 있고, 생년월일시는 보이지 않아요.`
          : "공유를 켜면 링크를 아는 누구나 캐릭터·웰니스·취미 결과를 볼 수 있어요. 생년월일시는 공개되지 않아요."}
      </span>
      {message && (
        <p className={message.type === "ok" ? "sj-ok" : "sj-error"} role={message.type === "ok" ? "status" : "alert"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
