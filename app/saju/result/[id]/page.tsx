import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getOwnResult, getSessionUser } from "@/lib/saju/data";
import { rebuildResult } from "@/lib/saju/result-store";
import ResultView from "../../_components/result-view";
import ShareControls from "../../_components/share-controls";

export const metadata: Metadata = { title: "내 사주 취미 결과" };

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

/** 본인 결과만 볼 수 있다. 다른 사람 결과나 없는 결과는 DB의 RLS 때문에 조회되지 않아 404가 된다. */
async function MemberResult({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getSessionUser();
  if (!user) redirect(`/saju/login?next=${encodeURIComponent(`/saju/result/${id}`)}`);

  const row = await getOwnResult(supabase, id);
  if (!row) notFound();
  const result = rebuildResult(row.saju_palja, row.scores);
  if (!result) notFound();

  return (
    <div className="sj-stack">
      <section className="sj-card sj-stack" style={{ gap: 12 }}>
        <div className="sj-section-title">
          <h2>저장된 결과</h2>
          <span>{dateFormatter.format(new Date(row.created_at))} 분석</span>
        </div>
        <ShareControls id={row.id} initialPublic={row.is_public} />
      </section>

      <ResultView data={result} mode="member" />

      <div className="sj-actions">
        <Link href="/saju/mypage" className="sj-btn sj-btn-ghost">
          내 결과 목록
        </Link>
        <Link href="/saju/input" className="sj-btn">
          다른 사주로 다시 해보기
        </Link>
      </div>
    </div>
  );
}

export default function SajuMemberResultPage(props: PageProps<"/saju/result/[id]">) {
  return (
    <Suspense fallback={<p className="sj-hint sj-center">결과를 불러오는 중이에요...</p>}>
      <MemberResult params={props.params} />
    </Suspense>
  );
}
