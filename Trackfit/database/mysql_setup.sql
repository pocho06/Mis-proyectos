CREATE DATABASE IF NOT EXISTS `trackfit`;

USE `trackfit`;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  height_cm INT NOT NULL,
  initial_weight_kg DECIMAL(5,2) NOT NULL,
  target_weight_kg DECIMAL(5,2) NOT NULL,
  age INT NOT NULL,
  activity_level ENUM('Sedentario','Ligero','Moderado','Activo','Muy activo') NOT NULL,
  calorie_goal_kcal INT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT chk_profiles_height CHECK (height_cm BETWEEN 120 AND 230),
  CONSTRAINT chk_profiles_initial_weight CHECK (initial_weight_kg > 0),
  CONSTRAINT chk_profiles_target_weight CHECK (target_weight_kg > 0),
  CONSTRAINT chk_profiles_age CHECK (age BETWEEN 12 AND 100),
  CONSTRAINT chk_profiles_calories CHECK (calorie_goal_kcal BETWEEN 1000 AND 6000),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS weight_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  entry_date DATE NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_weight_user_date (user_id, entry_date),
  KEY idx_weight_entries_user_date (user_id, entry_date),
  CONSTRAINT chk_weight_value CHECK (weight_kg BETWEEN 35 AND 250),
  CONSTRAINT fk_weight_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exercise_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  entry_date DATE NOT NULL,
  activity_type VARCHAR(80) NOT NULL,
  duration_minutes INT NOT NULL,
  intensity ENUM('Baja','Media','Alta') NOT NULL,
  calories_burned INT NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_exercise_entries_user_date (user_id, entry_date),
  CONSTRAINT chk_exercise_duration CHECK (duration_minutes > 0),
  CONSTRAINT chk_exercise_calories CHECK (calories_burned >= 0),
  CONSTRAINT fk_exercise_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS routine_plans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  objective TEXT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_routine_plans_user_active (user_id, active),
  CONSTRAINT chk_routine_plans_active CHECK (active IN (0,1)),
  CONSTRAINT fk_routine_plans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS routine_tasks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  plan_id BIGINT UNSIGNED NOT NULL,
  day_of_week ENUM('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo') NOT NULL,
  activity_name VARCHAR(100) NOT NULL,
  duration_label VARCHAR(40) NULL,
  status ENUM('Pendiente','En progreso','Completada') NOT NULL DEFAULT 'Pendiente',
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_routine_tasks_plan_day (plan_id, day_of_week, sort_order),
  CONSTRAINT fk_routine_tasks_plan FOREIGN KEY (plan_id) REFERENCES routine_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nutrition_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  entry_date DATE NOT NULL,
  calories_consumed INT NOT NULL,
  protein_g INT NOT NULL DEFAULT 0,
  carbs_g INT NOT NULL DEFAULT 0,
  fat_g INT NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_nutrition_user_date (user_id, entry_date),
  KEY idx_nutrition_entries_user_date (user_id, entry_date),
  CONSTRAINT chk_nutrition_calories CHECK (calories_consumed >= 0),
  CONSTRAINT chk_nutrition_protein CHECK (protein_g >= 0),
  CONSTRAINT chk_nutrition_carbs CHECK (carbs_g >= 0),
  CONSTRAINT chk_nutrition_fat CHECK (fat_g >= 0),
  CONSTRAINT fk_nutrition_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS habits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  frequency VARCHAR(40) NOT NULL DEFAULT 'Diario',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_habits_user_active (user_id, active),
  CONSTRAINT chk_habits_active CHECK (active IN (0,1)),
  CONSTRAINT fk_habits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS habit_completions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  habit_id BIGINT UNSIGNED NOT NULL,
  completion_date DATE NOT NULL,
  completed TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_habit_completion_date (habit_id, completion_date),
  KEY idx_habit_completions_habit_date (habit_id, completion_date),
  CONSTRAINT chk_habit_completed CHECK (completed IN (0,1)),
  CONSTRAINT fk_habit_completions_habit FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS goals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(140) NOT NULL,
  target_weight_kg DECIMAL(5,2) NULL,
  target_date DATE NOT NULL,
  status ENUM('Activa','Pausada','Completada','Cancelada') NOT NULL DEFAULT 'Activa',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_goals_user_status (user_id, status),
  CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS achievements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  achievement_key VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  condition_text TEXT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_achievements_key (achievement_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_achievements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  achievement_id BIGINT UNSIGNED NOT NULL,
  unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_achievement (user_id, achievement_id),
  CONSTRAINT fk_user_achievements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_achievements_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
