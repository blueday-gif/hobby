import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getSharedResult } from "@/lib/saju/data";
import { rebuildSharedResult } from "@/lib/saju/result-store";
import ResultView from "../../_components/result-view";

/** 공유 링크를 미리보기(카카오톡·메신저 등)에 보여줄 제목과 설명. 생년월일시는 포함하지 않는다. */
export async function generateMetadata(props: PageProps<"/saju/share/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const row = await getSharedResult(id);
  if (!row) return { title: "공유된 결과", robots: { index: false } };

  const title = `${row.day_master_nickname} · ${row.top_hobby_name} 추천`;
  const description = `${row.stem_ko} 일간 · 대표 분류 ${row.top_category_name} · ${row.top_hobby_short_copy}`;
  return {
    title,
    description,
    robots: { index: false },
    openGraph: { title, description, type: "website" },
  };
}

async function SharedContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getSharedResult(id);
  if (!row) notFound();
  const data = rebuildSharedResult(row.stem_code, row.scores);
  if (!data) notFound();

  return (
    <div className="sj-stack">
      <p className="sj-banner" role="note">
        친구가 공유한 사주취미 결과예요. 생년월일시는 공개되지 않아요.
      </p>
      <ResultView data={data} mode="share" />
      <section className="sj-card sj-center sj-stack">
        <h2>나는 어떤 취미가 맞을까?</h2>
        <p className="sj-hint">생년월일시만 입력하면 1분 안에 나만의 캐릭터와 취미를 알려드려요.</p>
        <div className="sj-actions">
          <Link href="/saju/input" className="sj-btn">
            내 사주 취미 찾기
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function SajuSharePage(props: PageProps<"/saju/share/[id]">) {
  return (
    <Suspense fallback={<p className="sj-hint sj-center">결과를 불러오는 중이에요...</p>}>
      <SharedContent params={props.params} />
    </Suspense>
  );
}
