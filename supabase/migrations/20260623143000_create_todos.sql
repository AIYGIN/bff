create extension if not exists pgcrypto;

create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  owner_user_id text not null,
  title text not null check (char_length(title) between 1 and 80),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists todos_owner_user_id_created_at_idx
  on todos (owner_user_id, created_at desc);
