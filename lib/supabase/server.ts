import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "./env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * 서버 컴포넌트 / 라우트 핸들러에서 쓰는 Supabase 클라이언트.
 * 요청 쿠키에서 익명 세션을 읽어 RLS가 본인 데이터만 보게 한다.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(SUPABASE_URL!, SUPABASE_PUBLIC_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트에서 호출된 경우 set이 막힐 수 있다.
            // 세션 갱신은 미들웨어가 담당하므로 무시해도 된다.
          }
        },
      },
    }
  );
}
