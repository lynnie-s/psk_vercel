-- 在 Supabase → SQL Editor 執行這段，建立資料表

create table if not exists responses (
  id           bigint generated always as identity primary key,
  personality  text not null check (personality in ('G','R','C','E')),
  shade        text not null check (shade in ('bright','natural','healthy','white')),
  answers      jsonb default '[]',
  ip           text,
  ua           text,
  created_at   timestamptz default now()
);

-- 讓 service_role 可以讀寫（預設就有，這行可不執行）
-- alter table responses enable row level security;

-- Index 讓查詢更快
create index if not exists idx_responses_personality on responses(personality);
create index if not exists idx_responses_shade on responses(shade);
create index if not exists idx_responses_created_at on responses(created_at desc);
