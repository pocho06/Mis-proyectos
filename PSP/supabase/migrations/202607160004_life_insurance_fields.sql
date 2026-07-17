-- Campos específicos para solicitudes de Seguro de Vida.
alter table public.insurance_requests
  add column if not exists client_name text,
  add column if not exists client_phone text,
  add column if not exists client_email text,
  add column if not exists postal_address text,
  add column if not exists coverage_amount numeric(14,2),
  add column if not exists monthly_premium numeric(14,2),
  add column if not exists funeral_option text,
  add column if not exists preexisting_conditions text,
  add column if not exists beneficiary_details text,
  add column if not exists payment_method text,
  add column if not exists payment_reference varchar(4);

do $$ begin
  alter table public.insurance_requests add constraint life_coverage_positive check (coverage_amount is null or coverage_amount > 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.insurance_requests add constraint life_premium_positive check (monthly_premium is null or monthly_premium > 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.insurance_requests add constraint payment_reference_last_four check (payment_reference is null or payment_reference ~ '^[0-9]{4}$');
exception when duplicate_object then null; end $$;