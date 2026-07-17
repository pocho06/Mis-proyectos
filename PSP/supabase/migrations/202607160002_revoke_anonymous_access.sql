-- PSP Seguros: ningún registro comercial debe ser accesible sin autenticación.
revoke all on table public.profiles from anon;
revoke all on table public.insurance_requests from anon;
revoke all on table public.help_requests from anon;
revoke all on sequence public.insurance_requests_request_number_seq from anon;
