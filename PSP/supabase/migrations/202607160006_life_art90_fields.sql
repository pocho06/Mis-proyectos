-- Producto Vida Individual ART 90 y Sepelio.
alter table public.insurance_requests
  add column if not exists birth_date date,
  add column if not exists life_product text,
  add column if not exists accepted_declaration boolean not null default false,
  add column if not exists accepted_at timestamptz;
alter table public.insurance_requests drop constraint if exists insurance_requests_insurance_type_check;
alter table public.insurance_requests add constraint insurance_requests_insurance_type_check check (
 insurance_type in ('Automotor','Moto','Hogar','Vida','Vida ART 90 y Sepelio','Comercio','Accidentes personales','Responsabilidad civil','Otro')
);