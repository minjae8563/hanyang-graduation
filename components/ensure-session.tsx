"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_READY } from "@/lib/supabase/env";

/**
 * 앱 진입 시 익명 세션이 없으면 자동으로 발급한다.
 * 사용자는 로그인 화면을 거치지 않지만, 데이터는 본인 세션에만 귀속된다.
 */
export function EnsureSession() {
  useEffect(() => {
    if (!SUPABASE_READY) return; // 셋업 전(.env.local 미설정) 상태면 조용히 대기

    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancelled && !data.session) {
        await supabase.auth.signInAnonymously();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
