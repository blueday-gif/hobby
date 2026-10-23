"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteResult } from "../actions";

/** 마이페이지 결과 목록에서 결과 하나를 삭제한다. 실수 방지를 위해 한 번 더 물어본다. */
export default function DeleteResultButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm("이 결과를 삭제할까요? 삭제하면 되돌릴 수 없고, 공유 링크도 더 이상 열리지 않아요.")) return;
    setError(null);
    startTransition(async () => {
      const outcome = await deleteResult(id);
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <button type="button" className="sj-btn sj-btn-danger sj-btn-sm" disabled={isPending} onClick={handleDelete}>
        {isPending ? "삭제 중..." : "삭제"}
      </button>
      {error && (
        <p className="sj-error" role="alert" style={{ width: "100%" }}>
          {error}
        </p>
      )}
    </>
  );
}
