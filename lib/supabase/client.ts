import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "./env";

/**
 * 브라우저(클라이언트 컴포넌트)에서 쓰는 Supabase 클라이언트.
 * 쿠키 기반이라 서버 컴포넌트/미들웨어와 세션을 공유한다.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL!, SUPABASE_PUBLIC_KEY!);
}
