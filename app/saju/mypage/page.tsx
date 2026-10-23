import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getProfile, getSessionUser, listOwnResults, profileToInput } from "@/lib/saju/data";
import { DAY_MASTER_TEMPLATES, HOBBY_BY_ID } from "@/lib/saju/templates";
import type { CategoryType, StemCode } from "@/lib/saju/types";
import { signOutSaju } from "../actions";
import DeleteResultButton from "../_components/delete-result-button";
import InputForm from "../_components/input-form";

export const metadata: Metadata = { title: "마이페이지" };

const CATEGORY_NAME: Record<CategoryType, string> = {
  SPORTS: "운동형",
  INTELLECT: "지능형",
  ART: "예술형",
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

/** 로그인한 본인만 볼 수 있다. 로그인 전이면 로그인 후 이 페이지로 돌아오도록 보낸다. */
async function MyPageContent() {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect(`/saju/login?next=${encodeURIComponent("/saju/mypage")}`);

  const [profile, results] = await Promise.all([
    getProfile(supabase, user.id),
    listOwnResults(supabase, user.id),
  ]);

  return (
    <div className="sj-stack">
      <section className="sj-card sj-stack" style={{ gap: 14 }}>
        <div>
          <span className="sj-eyebrow">마이페이지</span>
          <h1>내 정보</h1>
        </div>
        <div className="sj-history-item">
          <div>
            <small>로그인한 계정</small>
            <b>{user.email ?? "이메일 정보가 없는 계정"}</b>
          </div>
          <form action={signOutSaju}>
            <button type="submit" className="sj-btn sj-btn-ghost sj-btn-sm">
              로그아웃
            </button>
          </form>
        </div>
      </section>

      <section className="sj-card sj-stack" style={{ gap: 14 }}>
        <div className="sj-section-title">
          <h2>기본 프로필</h2>
          <span>{profile ? "저장된 정보로 채워져 있어요" : "아직 저장된 프로필이 없어요"}</span>
        </div>
        <p className="sj-hint">
          생년월일시를 저장해 두면 다음에 취미를 찾을 때 자동으로 채워져요. 여기서 바꿔 저장해도 이미 저장된 결과는 바뀌지
          않아요.
        </p>
        <InputForm
          mode="profile"
          isMember
          needsConsent={!profile}
          initial={profile ? profileToInput(profile) : null}
        />
      </section>

      <section className="sj-card sj-stack" style={{ gap: 14 }}>
        <div className="sj-section-title">
          <h2>내 결과 기록</h2>
          <span>{results.length}개</span>
        </div>

        {results.length === 0 ? (
          <div className="sj-empty sj-stack" style={{ alignItems: "center", gap: 12 }}>
            <p>아직 저장된 결과가 없어요.</p>
            <Link href="/saju/input" className="sj-btn sj-btn-sm">
              내 취미 찾으러 가기
            </Link>
          </div>
        ) : (
          <ul className="sj-history" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {results.map((row) => {
              const dayMaster = DAY_MASTER_TEMPLATES[row.stem_code as StemCode];
              const hobby = HOBBY_BY_ID[row.top_hobby_id];
              return (
                <li key={row.id} className="sj-history-item">
                  <div>
                    <b>{hobby?.name ?? "추천 취미"}</b>
                    <small>
                      {CATEGORY_NAME[row.top_category] ?? row.top_category}
                      {dayMaster ? ` · ${dayMaster.nameKo} ${dayMaster.nickname}` : ""}
                    </small>
                    <small>
                      {dateFormatter.format(new Date(row.created_at))} 분석
                      {row.is_public ? " · 공유 중" : ""}
                    </small>
                  </div>
                  <div className="sj-actions">
                    <Link href={`/saju/result/${row.id}`} className="sj-btn sj-btn-sm">
                      보기
                    </Link>
                    <DeleteResultButton id={row.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function SajuMyPage() {
  return (
    <Suspense fallback={<p className="sj-hint sj-center">내 정보를 불러오는 중이에요...</p>}>
      <MyPageContent />
    </Suspense>
  );
}
