import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessionUser } from "@/lib/saju/data";
import MigrateClient from "../../_components/migrate-client";

export const metadata: Metadata = { title: "결과 저장 중" };

/** 회원 전용. 로그인하지 않았다면 로그인 화면으로 보내고, 로그인 후 이 페이지로 돌아온다. */
async function MigrateGate() {
  const { user } = await getSessionUser();
  if (!user) redirect("/saju/login?next=%2Fsaju%2Fresult%2Fmigrate");
  return <MigrateClient />;
}

export default function SajuMigratePage() {
  return (
    <Suspense fallback={<p className="sj-hint sj-center">불러오는 중이에요...</p>}>
      <MigrateGate />
    </Suspense>
  );
}
