-- Permite que un administrador cargue una solicitud para cualquier vendedor activo.
drop policy if exists "requests_insert_own_or_admin" on public.insurance_requests;
drop policy if exists "requests_seller_insert_own" on public.insurance_requests;
create policy "requests_insert_own_or_admin"
on public.insurance_requests for insert
to authenticated
with check (
  (
    seller_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and active = true)
  )
  or (select private.is_admin())
);