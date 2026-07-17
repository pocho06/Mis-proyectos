BEGIN TRANSACTION;

INSERT INTO users (id, name, email, created_at) VALUES
  (1, 'Usuario Demo', 'demo@trackfit.local', '2026-06-19 09:00:00');

INSERT INTO user_profiles (user_id, height_cm, initial_weight_kg, target_weight_kg, age, activity_level, calorie_goal_kcal, updated_at) VALUES
  (1, 178, 101.7, 85.0, 32, 'Moderado', 2200, '2026-06-19 09:00:00');

INSERT INTO weight_entries (user_id, entry_date, weight_kg, notes) VALUES
  (1, '2026-05-08', 101.7, 'Registro de control.'),
  (1, '2026-05-15', 100.6, 'Registro de control.'),
  (1, '2026-05-22', 99.2, 'Registro de control.'),
  (1, '2026-05-29', 98.3, 'Registro de control.'),
  (1, '2026-06-05', 97.1, 'Registro de control.'),
  (1, '2026-06-12', 96.1, 'Registro de control.'),
  (1, '2026-06-19', 95.0, 'Semana sólida, buen descanso.');

INSERT INTO exercise_entries (user_id, entry_date, activity_type, duration_minutes, intensity, calories_burned, notes) VALUES
  (1, '2026-06-06', 'Caminata', 45, 'Media', 290, ''),
  (1, '2026-06-07', 'Fuerza en casa', 35, 'Media', 230, ''),
  (1, '2026-06-09', 'Saltar cuerda', 20, 'Alta', 260, ''),
  (1, '2026-06-12', 'Pádel', 70, 'Alta', 610, ''),
  (1, '2026-06-14', 'Caminata', 50, 'Media', 320, ''),
  (1, '2026-06-16', 'Gimnasio', 55, 'Media', 410, ''),
  (1, '2026-06-18', 'Correr', 32, 'Alta', 420, '');

INSERT INTO routine_plans (id, user_id, name, objective, active, created_at) VALUES
  (1, 1, 'Objetivo 85 kg', 'Llegar a 85 kg con caminatas, fuerza y constancia semanal.', 1, '2026-06-19 09:00:00');

INSERT INTO routine_tasks (plan_id, day_of_week, activity_name, duration_label, status, sort_order) VALUES
  (1, 'Lunes', 'Caminata', '45 min', 'Completada', 1),
  (1, 'Lunes', 'Fuerza', '35 min', 'Completada', 2),
  (1, 'Martes', 'Caminata', '45 min', 'Completada', 1),
  (1, 'Martes', 'Cuerda', '20 min', 'Completada', 2),
  (1, 'Miércoles', 'Pádel', '70 min', 'Completada', 1),
  (1, 'Jueves', 'Gimnasio', '55 min', 'En progreso', 1),
  (1, 'Viernes', 'Caminata', '45 min', 'Pendiente', 1),
  (1, 'Sábado', 'Fuerza en casa', '40 min', 'Pendiente', 1),
  (1, 'Domingo', 'Movilidad', '25 min', 'Pendiente', 1);

INSERT INTO nutrition_entries (user_id, entry_date, calories_consumed, protein_g, carbs_g, fat_g) VALUES
  (1, '2026-06-06', 2180, 150, 210, 62),
  (1, '2026-06-07', 2240, 156, 222, 67),
  (1, '2026-06-08', 2105, 162, 234, 72),
  (1, '2026-06-09', 2320, 168, 246, 62),
  (1, '2026-06-10', 2195, 150, 258, 67),
  (1, '2026-06-11', 2140, 156, 210, 72),
  (1, '2026-06-12', 2080, 162, 222, 62),
  (1, '2026-06-13', 2260, 168, 234, 67),
  (1, '2026-06-14', 2210, 150, 246, 72),
  (1, '2026-06-15', 2050, 156, 258, 62),
  (1, '2026-06-16', 2175, 162, 210, 67),
  (1, '2026-06-17', 2120, 168, 222, 72),
  (1, '2026-06-18', 2200, 150, 234, 62),
  (1, '2026-06-19', 2110, 156, 246, 67);

INSERT INTO habits (id, user_id, name, frequency, active, created_at) VALUES
  (1, 1, 'Tomar 3 litros de agua', 'Diario', 1, '2026-06-02 09:00:00'),
  (2, 1, 'Caminar 45 minutos', 'Diario', 1, '2026-06-05 09:00:00'),
  (3, 1, 'Programar 2 horas', 'Lunes a viernes', 1, '2026-06-04 09:00:00'),
  (4, 1, 'Leer 20 páginas', 'Diario', 1, '2026-06-09 09:00:00'),
  (5, 1, 'Dormir 8 horas', 'Diario', 1, '2026-06-06 09:00:00');

WITH RECURSIVE dates(completion_date) AS (
  SELECT date('2026-06-02')
  UNION ALL
  SELECT date(completion_date, '+1 day') FROM dates WHERE completion_date < date('2026-06-19')
)
INSERT INTO habit_completions (habit_id, completion_date, completed)
SELECT h.id, d.completion_date, 1
FROM habits h
JOIN dates d
WHERE
  (h.id = 1 AND d.completion_date >= '2026-06-02') OR
  (h.id = 2 AND d.completion_date >= '2026-06-05') OR
  (h.id = 3 AND d.completion_date >= '2026-06-04' AND strftime('%w', d.completion_date) NOT IN ('0','6')) OR
  (h.id = 4 AND d.completion_date >= '2026-06-09') OR
  (h.id = 5 AND d.completion_date >= '2026-06-06');

INSERT INTO goals (id, user_id, title, target_weight_kg, target_date, status, created_at) VALUES
  (1, 1, 'Llegar a 85 kg', 85.0, '2026-09-30', 'Activa', '2026-05-08 09:00:00');

INSERT INTO achievements (id, achievement_key, name, description, condition_text) VALUES
  (1, 'first_workout', 'Primer entrenamiento', 'Registraste tu primera actividad física.', 'Tener al menos 1 entrenamiento registrado.'),
  (2, 'seven_day_streak', '7 días consecutivos', 'Sostuviste hábitos durante una semana.', 'Alcanzar una racha de 7 días.'),
  (3, 'first_kg_lost', 'Primer kilo perdido', 'Bajaste al menos 1 kg desde el inicio.', 'Perder 1 kg desde el peso inicial.'),
  (4, 'five_kg_lost', '5 kilos perdidos', 'Superaste la marca de 5 kg perdidos.', 'Perder 5 kg desde el peso inicial.'),
  (5, 'thirty_day_streak', '30 días seguidos', 'Una racha larga de disciplina diaria.', 'Alcanzar una racha de 30 días.'),
  (6, 'goal_reached', 'Meta alcanzada', 'Llegaste al peso objetivo principal.', 'Peso actual menor o igual al peso objetivo.');

INSERT INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES
  (1, 1, '2026-06-06 19:00:00'),
  (1, 2, '2026-06-09 19:00:00'),
  (1, 3, '2026-05-15 09:00:00'),
  (1, 4, '2026-06-05 09:00:00');

COMMIT;
