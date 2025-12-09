-- supabase/migrations/20251209121500_fix_accounts_defaults_and_rls.sql
alter table public.accounts
  alter column tenant_id set default gen_random_uuid(),
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table public.accounts enable row level security;

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
