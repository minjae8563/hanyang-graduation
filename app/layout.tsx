import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "마음로그 · 기록으로 살피는 마음 돌봄",
  description:
    "하루의 마음을 편하게 적어두면, 마음의 흐름을 함께 살펴보고 돌봐주는 공간이에요.",
};

export const viewport: Viewport = {
  themeColor: "#FBF7F0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="min-h-dvh font-sans">
        {children}
      </body>
    </html>
  );
}
