import type { Metadata } from "next";
import { EnsureSession } from "@/components/ensure-session";

export const metadata: Metadata = {
  title: "마음로그 · 오늘의 마음을 기록해요",
};

// 서비스 화면(/app)에 들어왔을 때만 익명 세션을 발급한다.
// (소개 페이지만 보고 나가는 방문자에게는 계정을 만들지 않음)
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EnsureSession />
      {children}
    </>
  );
}
