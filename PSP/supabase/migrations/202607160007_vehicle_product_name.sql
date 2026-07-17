-- Agrega el producto comercial Seguro de vehículo sin borrar tipos históricos.
alter table public.insurance_requests drop constraint if exists insurance_requests_insurance_type_check;
alter table public.insurance_requests add constraint insurance_requests_insurance_type_check check (
 insurance_type in ('Automotor','Seguro de vehículo','Moto','Hogar','Vida','Vida ART 90 y Sepelio','Comercio','Accidentes personales','Responsabilidad civil','Otro')
);