-- Datos y archivos privados para cotizaciones de automotor y moto.
alter table public.insurance_requests
  add column if not exists vehicle_year smallint,
  add column if not exists postal_code varchar(10),
  add column if not exists vehicle_use text,
  add column if not exists has_gnc boolean,
  add column if not exists vehicle_card_path text;

alter table public.insurance_requests drop constraint if exists insurance_requests_insurance_type_check;
alter table public.insurance_requests add constraint insurance_requests_insurance_type_check check (
  insurance_type in ('Automotor','Moto','Hogar','Vida','Comercio','Accidentes personales','Responsabilidad civil','Otro')
);
alter table public.insurance_requests drop constraint if exists vehicle_year_valid;
alter table public.insurance_requests add constraint vehicle_year_valid check (vehicle_year is null or vehicle_year between 1900 and 2100);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('vehicle-documents','vehicle-documents',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "vehicle_docs_select_owner_or_admin" on storage.objects;
create policy "vehicle_docs_select_owner_or_admin" on storage.objects for select to authenticated
using (bucket_id='vehicle-documents' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select private.is_admin())));
drop policy if exists "vehicle_docs_insert_owner_or_admin" on storage.objects;
create policy "vehicle_docs_insert_owner_or_admin" on storage.objects for insert to authenticated
with check (bucket_id='vehicle-documents' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select private.is_admin())));
drop policy if exists "vehicle_docs_delete_owner_or_admin" on storage.objects;
create policy "vehicle_docs_delete_owner_or_admin" on storage.objects for delete to authenticated
using (bucket_id='vehicle-documents' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select private.is_admin())));