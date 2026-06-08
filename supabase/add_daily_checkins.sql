-- =====================================================================
-- [추가 마이그레이션] daily_checkins : 매일 가벼운 미니체크
-- 이미 schema.sql 을 실행한 프로젝트라면 이 파일만 SQL Editor에 붙여 실행하세요.
-- (여러 번 실행해도 안전합니다.)
-- =====================================================================

-- 오늘 기준 증상 신호 (각 0~3, 높을수록 힘듦)
create table if not exists public.daily_checkins (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid()
                 references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  checkin_date date not null default current_date,
  scores       jsonb not null,  -- {"mood":0..3,"interest":0..3,"energy":0..3,"sleep":0..3,"focus":0..3}
  total        int,             -- 0~15 합계 (빠른 표시용)
  unique (user_id, checkin_date) -- 하루 한 건 (수정 시 upsert)
);

create index if not exists daily_checkins_user_date_idx
  on public.daily_checkins (user_id, checkin_date desc);

alter table public.daily_checkins enable row level security;

drop policy if exists "own_daily_checkins" on public.daily_checkins;
create policy "own_daily_checkins" on public.daily_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
