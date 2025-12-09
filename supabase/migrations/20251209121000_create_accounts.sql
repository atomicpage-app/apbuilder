-- supabase/migrations/20251209121000_create_accounts.sql

-- Garante que o tipo account_status exista
do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'account_status'
  ) then
    create type account_status as enum ('pending_email_verification', 'active', 'disabled');
  end if;
end
$$;

-- Cria a tabela accounts se ainda não existir
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  name text not null,
  phone text,
  status account_status not null default 'pending_email_verification',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.accounts
  add constraint accounts_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

create unique index if not exists accounts_email_key
  on public.accounts(email);

alter table public.accounts enable row level security;

-- Policies idempotentes
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'accounts'
      and policyname = 'Users can read own account'
  ) then
    create policy "Users can read own account"
    on public.accounts
    for select
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'accounts'
      and policyname = 'Users can update own account'
  ) then
    create policy "Users can update own account"
    on public.accounts
    for update
    using (auth.uid() = user_id);
  end if;
end
$$;
