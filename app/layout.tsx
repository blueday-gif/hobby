import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "사주취미 | 사주로 찾는 나의 취미",
  description: "생년월일시로 오행을 분석해 나에게 맞는 취미를 찾아보세요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <head>
        {/* 본문 글꼴: Pretendard (미니멀 디자인) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
