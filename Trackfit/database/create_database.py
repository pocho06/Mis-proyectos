from pathlib import Path
import sqlite3

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "trackfit.sqlite"
SCHEMA_PATH = BASE_DIR / "schema.sql"
SEED_PATH = BASE_DIR / "seed.sql"

TABLES = [
    "user_achievements",
    "achievements",
    "goals",
    "habit_completions",
    "habits",
    "nutrition_entries",
    "routine_tasks",
    "routine_plans",
    "exercise_entries",
    "weight_entries",
    "user_profiles",
    "users",
]


def build_database() -> None:
    connection = sqlite3.connect(DB_PATH)
    try:
        connection.execute("PRAGMA journal_mode = OFF;")
        connection.execute("PRAGMA synchronous = OFF;")
        connection.execute("PRAGMA foreign_keys = OFF;")
        for table in TABLES:
            connection.execute(f"DROP TABLE IF EXISTS {table};")
        connection.commit()
        connection.execute("PRAGMA foreign_keys = ON;")
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8-sig"))
        connection.executescript(SEED_PATH.read_text(encoding="utf-8-sig"))
        connection.commit()
    finally:
        connection.close()


if __name__ == "__main__":
    build_database()
    print(f"Base de datos creada: {DB_PATH}")
