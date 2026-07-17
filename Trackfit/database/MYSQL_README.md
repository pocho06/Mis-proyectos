# TrackFit con MySQL

## Archivos

- `mysql_setup.sql`: crea la base `trackfit`, todas las tablas y los logros iniciales.
- `mysql_schema.sql`: solo estructura de tablas.
- `mysql_seed.sql`: solo datos iniciales de logros.
- `mysql_user.sql`: crea el usuario `trackfit_user` y le da permisos sobre la base.
- `mysql.env.example`: variables de entorno sugeridas para conectar el servidor.

## Crear la base

Desde una terminal con MySQL instalado:

```powershell
mysql -u root -p < database/mysql_setup.sql
mysql -u root -p < database/mysql_user.sql
```

## Configuracion para el servidor

Instalar el driver Python, necesario para que `server.py` pueda conectarse a MySQL:

```powershell
pip install mysql-connector-python
```

Variables necesarias:

```powershell
$env:TRACKFIT_DB_ENGINE='mysql'
$env:TRACKFIT_MYSQL_HOST='127.0.0.1'
$env:TRACKFIT_MYSQL_PORT='3306'
$env:TRACKFIT_MYSQL_USER='trackfit_user'
$env:TRACKFIT_MYSQL_PASSWORD='trackfit_password'
$env:TRACKFIT_MYSQL_DATABASE='trackfit'
```

Luego iniciar:

```powershell
python -B server.py --port 8000
```

