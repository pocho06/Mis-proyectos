# Base de datos de TrackFit

Esta carpeta contiene una base SQLite para TrackFit.

Archivos principales:

- `trackfit.sqlite`: base de datos generada y lista para usar.
- `schema.sql`: estructura completa de tablas, relaciones e índices.
- `seed.sql`: datos iniciales de ejemplo.
- `create_database.py`: script para regenerar la base.

Tablas incluidas:

- `users`
- `user_profiles`
- `weight_entries`
- `exercise_entries`
- `routine_plans`
- `routine_tasks`
- `nutrition_entries`
- `habits`
- `habit_completions`
- `goals`
- `achievements`
- `user_achievements`

Para regenerar la base:

```powershell
python .\database\create_database.py
```

Nota: `trackfit.db` y `trackfit.db-journal`, si aparecen, son archivos parciales de un primer intento bloqueado por OneDrive. La base correcta es `trackfit.sqlite`.
