// Supabase 공개 키 이름 호환 처리.
// 신규 이름(PUBLISHABLE_KEY)을 우선 사용하고, 구버전(ANON_KEY)도 폴백으로 지원한다.
// NEXT_PUBLIC_* 는 빌드 시 리터럴로 인라인되므로 각 이름을 직접 참조해야 한다.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const SUPABASE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const SUPABASE_READY = Boolean(SUPABASE_URL && SUPABASE_PUBLIC_KEY);
