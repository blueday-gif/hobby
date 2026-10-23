import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "시설ON | 시설관리 포털",
  description: "시설물 상태와 점검 일정을 한눈에 확인하는 시설관리 대시보드",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
