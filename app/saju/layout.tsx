import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./saju.css";

export const metadata: Metadata = {
  title: { default: "사주취미 | 사주로 찾는 나의 취미", template: "%s | 사주취미" },
  description:
    "생년월일시만 입력하면 만세력 기반 오행 분석으로 나만의 일간 캐릭터와 운동형·지능형·예술형 취미를 1분 안에 추천해 드려요.",
};

export default function SajuLayout({ children }: { children: ReactNode }) {
  return (
    <div className="sj">
      <header className="sj-header">
        <div className="sj-header-inner">
          <Link href="/saju" className="sj-logo">
            <span className="sj-logo-mark" aria-hidden="true" />
            사주취미
          </Link>
          <nav className="sj-nav" aria-label="주요 메뉴">
            <Link href="/saju/input">취미 찾기</Link>
            <Link href="/saju/mypage">마이페이지</Link>
          </nav>
        </div>
      </header>
      <main className="sj-main">{children}</main>
    </div>
  );
}
