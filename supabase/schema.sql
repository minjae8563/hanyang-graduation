-- =====================================================================
-- 마음로그 (MindLog) DB 스키마
-- Supabase 대시보드 → SQL Editor 에 전체 붙여넣고 실행하세요.
-- 여러 번 실행해도 안전하도록 작성되어 있습니다 (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) entries : 일기/메모 기록 (2.1 분석 결과도 여기에 채워짐)
-- ---------------------------------------------------------------------
create table if not exists public.entries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid()
                   references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  content        text not null,
  -- 아래 컬럼은 LLM 분석(2.1) 단계에서 채워진다. 지금은 비어 있어도 됨.
  sentiment      numeric,      -- -1.0(부정) ~ 1.0(긍정)
  symptom_scores jsonb,        -- PHQ-9 9개 증상축 점수 {"q1":0..3, ...}
  activities     jsonb,        -- 텍스트에서 추출된 활동 ["산책","친구와 통화"]
  risk_level     text,         -- 'none' | 'low' | 'medium' | 'high'
  feedback_message text        -- LLM 상담형 피드백 메시지
);

-- ---------------------------------------------------------------------
-- 2) phq9_responses : PHQ-9 자가설문 (예측 모델의 정답지 = label)
-- ---------------------------------------------------------------------
create table if not exists public.phq9_responses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
                references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  scores      jsonb not null,  -- {"q1":0..3, ..., "q9":0..3}
  total       int not null     -- 0 ~ 27
);

-- ---------------------------------------------------------------------
-- 3) predictions : 14일 특징 → 다음 PHQ-9 예측 결과 (2.2)
-- ---------------------------------------------------------------------
create table if not exists public.predictions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid()
                    references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  target_date     date not null,
  predicted_total numeric not null,  -- 예측 PHQ-9 (0 ~ 27)
  features        jsonb,             -- 입력에 사용된 14일 특징 스냅샷
  model_version   text default 'v0'
);

-- ---------------------------------------------------------------------
-- 4) feedback : UI/UX·프롬프트 고도화를 위한 사용자 피드백 (2.4)
-- ---------------------------------------------------------------------
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
                references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  target_type text not null,  -- 'feedback_message' | 'recommendation' | 'ui'
  target_id   uuid,
  rating      int,            -- 👎=-1 / 👍=1 (또는 1~5)
  comment     text
);

-- ---------------------------------------------------------------------
-- 인덱스
-- ---------------------------------------------------------------------
create index if not exists entries_user_created_idx
  on public.entries (user_id, created_at desc);
create index if not exists phq9_user_created_idx
  on public.phq9_responses (user_id, created_at desc);
create index if not exists predictions_user_date_idx
  on public.predictions (user_id, target_date desc);
create index if not exists feedback_user_created_idx
  on public.feedback (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- Row Level Security : 익명 사용자도 auth.uid()로 식별되어 본인 데이터만 접근
-- ---------------------------------------------------------------------
alter table public.entries        enable row level security;
alter table public.phq9_responses enable row level security;
alter table public.predictions    enable row level security;
alter table public.feedback       enable row level security;

drop policy if exists "own_entries" on public.entries;
create policy "own_entries" on public.entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_phq9" on public.phq9_responses;
create policy "own_phq9" on public.phq9_responses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_predictions" on public.predictions;
create policy "own_predictions" on public.predictions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_feedback" on public.feedback;
create policy "own_feedback" on public.feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 5) daily_checkins : 매일 가벼운 미니체크 (오늘 기준 증상 신호, 각 0~3)
-- ---------------------------------------------------------------------
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
