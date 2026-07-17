PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INTEGER PRIMARY KEY,
  height_cm INTEGER NOT NULL CHECK (height_cm BETWEEN 120 AND 230),
  initial_weight_kg REAL NOT NULL CHECK (initial_weight_kg > 0),
  target_weight_kg REAL NOT NULL CHECK (target_weight_kg > 0),
  age INTEGER NOT NULL CHECK (age BETWEEN 12 AND 100),
  activity_level TEXT NOT NULL CHECK (activity_level IN ('Sedentario','Ligero','Moderado','Activo','Muy activo')),
  calorie_goal_kcal INTEGER NOT NULL CHECK (calorie_goal_kcal BETWEEN 1000 AND 6000),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weight_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  entry_date TEXT NOT NULL,
  weight_kg REAL NOT NULL CHECK (weight_kg BETWEEN 35 AND 250),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, entry_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exercise_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  entry_date TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  intensity TEXT NOT NULL CHECK (intensity IN ('Baja','Media','Alta')),
  calories_burned INTEGER NOT NULL DEFAULT 0 CHECK (calories_burned >= 0),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS routine_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  objective TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS routine_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo')),
  activity_name TEXT NOT NULL,
  duration_label TEXT,
  status TEXT NOT NULL DEFAULT 'Pendiente' CHECK (status IN ('Pendiente','En progreso','Completada')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (plan_id) REFERENCES routine_plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS nutrition_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  entry_date TEXT NOT NULL,
  calories_consumed INTEGER NOT NULL CHECK (calories_consumed >= 0),
  protein_g INTEGER NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  carbs_g INTEGER NOT NULL DEFAULT 0 CHECK (carbs_g >= 0),
  fat_g INTEGER NOT NULL DEFAULT 0 CHECK (fat_g >= 0),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, entry_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'Diario',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS habit_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL,
  completion_date TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 1 CHECK (completed IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (habit_id, completion_date),
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  target_weight_kg REAL,
  target_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Activa' CHECK (status IN ('Activa','Pausada','Completada','Cancelada')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  achievement_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  condition_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  achievement_id INTEGER NOT NULL,
  unlocked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, achievement_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_weight_entries_user_date ON weight_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_exercise_entries_user_date ON exercise_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_entries_user_date ON nutrition_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON habit_completions(habit_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);
