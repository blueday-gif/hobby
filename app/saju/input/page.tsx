import type { Metadata } from "next";
import { Suspense } from "react";
import { getProfile, getSessionUser, profileToInput } from "@/lib/saju/data";
import InputForm from "../_components/input-form";

export const metadata: Metadata = { title: "생년월일시 입력" };

/** 로그인한 회원이면 저장된 프로필을 불러와 폼을 미리 채운다. 요청 쿠키를 읽으므로 Suspense 안에서 렌더링한다. */
async function InputFormLoader() {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return <InputForm mode="result" isMember={false} needsConsent={false} />;
  }

  const profile = await getProfile(supabase, user.id);
  return (
    <InputForm
      mode="result"
      isMember
      needsConsent={!profile}
      initial={profile ? profileToInput(profile) : null}
    />
  );
}

export default function SajuInputPage() {
  return (
    <div className="sj-stack">
      <section className="sj-hero">
        <span className="sj-eyebrow">1분이면 충분해요</span>
        <h1>생년월일시를 알려주세요</h1>
        <p className="sj-lead">
          입력하신 정보로 사주 팔자와 오행 분포를 계산해요. 시간을 몰라도 괜찮고, 가입 없이 결과를 볼 수 있어요.
        </p>
      </section>

      <section className="sj-card">
        <Suspense fallback={<p className="sj-hint">입력 폼을 불러오는 중이에요...</p>}>
          <InputFormLoader />
        </Suspense>
      </section>
    </div>
  );
}
