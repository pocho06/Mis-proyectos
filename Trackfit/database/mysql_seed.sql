USE `trackfit`;

INSERT INTO achievements (achievement_key, name, description, condition_text) VALUES
  ('first_workout', 'Primer entrenamiento', 'Registraste tu primera actividad física.', 'Tener al menos 1 entrenamiento registrado.'),
  ('seven_day_streak', '7 días consecutivos', 'Sostuviste hábitos durante una semana.', 'Alcanzar una racha de 7 días.'),
  ('first_kg_lost', 'Primer kilo perdido', 'Bajaste al menos 1 kg desde el inicio.', 'Perder 1 kg desde el peso inicial.'),
  ('five_kg_lost', '5 kilos perdidos', 'Superaste la marca de 5 kg perdidos.', 'Perder 5 kg desde el peso inicial.'),
  ('thirty_day_streak', '30 días seguidos', 'Una racha larga de disciplina diaria.', 'Alcanzar una racha de 30 días.'),
  ('goal_reached', 'Meta alcanzada', 'Llegaste al peso objetivo principal.', 'Peso actual menor o igual al peso objetivo.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  condition_text = VALUES(condition_text);
