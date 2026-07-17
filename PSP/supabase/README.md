# Base de datos de PSP en Supabase

La migración `migrations/202607160001_initial_psp_schema.sql` crea:

- `profiles`: usuarios, nombres y rol (`admin` o `seller`).
- `insurance_requests`: solicitudes enviadas por vendedores.
- `help_requests`: consultas dirigidas al administrador y sus respuestas.
- índices, validaciones, actualización automática de fechas y políticas RLS.

## Crear la base

1. Crear un proyecto en [Supabase](https://supabase.com/dashboard).
2. Abrir **SQL Editor** → **New query**.
3. Copiar y ejecutar todo el contenido de la migración.
4. En **Authentication** crear primero la cuenta de Diego Martin Poccioni.
5. Convertir esa cuenta en administrador usando su correo:

```sql
update public.profiles
set role = 'admin', full_name = 'Diego Martin Poccioni'
where id = (
  select id from auth.users where email = 'CORREO_DE_DIEGO'
);
```

6. Crear las cuentas de los vendedores desde Authentication. El trigger les asignará automáticamente el rol `seller`.

## Seguridad

- Cada vendedor puede ver y crear únicamente sus propias solicitudes y consultas.
- El administrador puede ver todos los registros, actualizar estados y responder consultas.
- Los vendedores no pueden asignarse el rol de administrador.
- No se permite acceso anónimo a las tablas.
- Nunca se debe colocar una clave `service_role` en los archivos del navegador.

## Datos necesarios para conectar la web

Desde **Project Settings → API** se necesitarán:

- Project URL.
- Publishable key.

Estos valores se configurarán en el próximo paso. No deben incluirse contraseñas ni la clave `service_role`.

