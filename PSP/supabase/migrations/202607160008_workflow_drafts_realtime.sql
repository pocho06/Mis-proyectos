-- Borradores, correcciones y tiempo real para el flujo comercial.
alter type public.request_status add value if not exists 'needs_correction' after 'in_review';
create table if not exists public.request_drafts (
  seller_id uuid primary key references public.profiles(id) on delete cascade,
  form_data jsonb not null default '{}'::jsonb,
  current_step smallint not null default 0 check (current_step between 0 and 10),
  updated_at timestamptz not null default now()
);
alter table public.request_drafts enable row level security;
drop policy if exists "drafts_owner_all" on public.request_drafts;
create policy "drafts_owner_all" on public.request_drafts for all to authenticated
using (seller_id=(select auth.uid())) with check (seller_id=(select auth.uid()));
grant select,insert,update,delete on public.request_drafts to authenticated;
drop trigger if exists request_drafts_set_updated_at on public.request_drafts;
create trigger request_drafts_set_updated_at before update on public.request_drafts for each row execute function public.set_updated_at();
do $$
egin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'insurance_requests'
  ) then
    alter publication supabase_realtime add table public.insurance_requests;
  end if;
end
$$;