from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


ROOT = Path(__file__).resolve().parent
DEFAULT_RUNTIME_DIR = Path(os.environ.get("TRACKFIT_RUNTIME_DIR", str(ROOT / "database")))
DB_PATH = Path(os.environ.get("TRACKFIT_DB_PATH", str(DEFAULT_RUNTIME_DIR / "trackfit_app.sqlite")))
SCHEMA_PATH = ROOT / "database" / "schema.sql"
SEED_PATH = ROOT / "database" / "seed.sql"
PASSWORD_ITERATIONS = 200_000
SESSIONS: dict[str, int] = {}
DB_ENGINE = os.environ.get("TRACKFIT_DB_ENGINE", "sqlite").strip().lower()
MYSQL_DATABASE = os.environ.get("TRACKFIT_MYSQL_DATABASE", "trackfit")
MYSQL_CONFIG = {
    "host": os.environ.get("TRACKFIT_MYSQL_HOST", "127.0.0.1"),
    "port": int(os.environ.get("TRACKFIT_MYSQL_PORT", "3306")),
    "user": os.environ.get("TRACKFIT_MYSQL_USER", "trackfit_user"),
    "password": os.environ.get("TRACKFIT_MYSQL_PASSWORD", "trackfit_password"),
    "database": MYSQL_DATABASE,
    "charset": "utf8mb4",
    "use_unicode": True,
}

try:
    import mysql.connector as mysql_connector
except ImportError:
    mysql_connector = None





def mysql_sql(sql: str) -> str:
    if "INSERT INTO user_profiles" in sql and "ON CONFLICT(user_id)" in sql:
        return """
            INSERT INTO user_profiles (
              user_id,
              height_cm,
              initial_weight_kg,
              target_weight_kg,
              age,
              activity_level,
              calorie_goal_kcal,
              updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
              height_cm = VALUES(height_cm),
              initial_weight_kg = VALUES(initial_weight_kg),
              target_weight_kg = VALUES(target_weight_kg),
              age = VALUES(age),
              activity_level = VALUES(activity_level),
              calorie_goal_kcal = VALUES(calorie_goal_kcal),
              updated_at = CURRENT_TIMESTAMP
        """

    if "INSERT INTO weight_entries" in sql and "ON CONFLICT(user_id, entry_date)" in sql:
        return """
            INSERT INTO weight_entries (user_id, entry_date, weight_kg, notes)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              weight_kg = VALUES(weight_kg),
              notes = VALUES(notes)
        """

    if "INSERT INTO nutrition_entries" in sql and "ON CONFLICT(user_id, entry_date)" in sql:
        return """
            INSERT INTO nutrition_entries (
              user_id,
              entry_date,
              calories_consumed,
              protein_g,
              carbs_g,
              fat_g,
              notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              calories_consumed = VALUES(calories_consumed),
              protein_g = VALUES(protein_g),
              carbs_g = VALUES(carbs_g),
              fat_g = VALUES(fat_g),
              notes = VALUES(notes)
        """

    if "INSERT INTO habit_completions" in sql and "ON CONFLICT(habit_id, completion_date)" in sql:
        return """
            INSERT INTO habit_completions (habit_id, completion_date, completed)
            VALUES (?, ?, 1)
            ON DUPLICATE KEY UPDATE completed = 1
        """

    return sql

class DatabaseConnection:
    def __init__(self, raw_connection: Any, engine: str):
        self.raw_connection = raw_connection
        self.engine = engine

    def __enter__(self) -> "DatabaseConnection":
        return self

    def __exit__(self, exc_type: Any, exc: Any, traceback: Any) -> None:
        if exc_type:
            self.raw_connection.rollback()
        self.raw_connection.close()

    def execute(self, sql: str, params: tuple[Any, ...] = ()) -> Any:
        if self.engine == "mysql":
            cursor = self.raw_connection.cursor(dictionary=True)
            cursor.execute(mysql_sql(sql).replace("?", "%s"), params)
            return cursor
        return self.raw_connection.execute(sql, params)

    def commit(self) -> None:
        self.raw_connection.commit()

    def close(self) -> None:
        self.raw_connection.close()


def json_default(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_ITERATIONS,
    ).hex()
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt}${digest}"


def verify_password(password: str, stored_hash: str | None) -> bool:
    if not stored_hash:
        return False

    try:
        algorithm, iterations, salt, expected = stored_hash.split("$", 3)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        int(iterations),
    ).hex()
    return hmac.compare_digest(digest, expected)


def public_user(row: sqlite3.Row | dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
    }


def validate_full_name(name: str) -> None:
    parts = [part for part in name.split() if part]
    if len(parts) < 2:
        raise ApiError(400, "Ingresa nombre y apellido.")


def validate_email(email: str) -> None:
    if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        raise ApiError(400, "Ingresa un email valido, por ejemplo fabriciopoccioni1@gmail.com.")


def validate_password(password: str) -> None:
    allowed_specials = "-_.@"
    has_allowed_special = any(character in allowed_specials for character in password)
    if len(password) < 8 or not has_allowed_special:
        raise ApiError(400, "La contrasena debe tener minimo 8 caracteres y un caracter especial: - _ . @")

class ApiError(Exception):
    def __init__(self, status: int, message: str):
        self.status = status
        self.message = message
        super().__init__(message)


def initialize_database() -> None:
    if DB_ENGINE == "mysql":
        return

    if DB_PATH.exists():
        return

    if not SCHEMA_PATH.exists() or not SEED_PATH.exists():
        raise ApiError(500, "No se encontraron schema.sql y seed.sql para crear la base.")

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    try:
        connection.execute("PRAGMA journal_mode = OFF")
        connection.execute("PRAGMA synchronous = OFF")
        connection.execute("PRAGMA foreign_keys = OFF")
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8-sig"))
        connection.executescript(SEED_PATH.read_text(encoding="utf-8-sig"))
        connection.commit()
    finally:
        connection.close()


def ensure_database_upgrades() -> None:
    if DB_ENGINE == "mysql":
        return

    connection = sqlite3.connect(DB_PATH)
    try:
        connection.execute("PRAGMA journal_mode = OFF")
        connection.execute("PRAGMA synchronous = OFF")
        columns = {row[1] for row in connection.execute("PRAGMA table_info(users)").fetchall()}
        if "password_hash" not in columns:
            connection.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
        connection.commit()
    finally:
        connection.close()


def connect() -> DatabaseConnection:
    if DB_ENGINE == "mysql":
        if mysql_connector is None:
            raise ApiError(500, "Falta instalar mysql-connector-python para usar MySQL.")
        raw_connection = mysql_connector.connect(**MYSQL_CONFIG)
        return DatabaseConnection(raw_connection, "mysql")

    initialize_database()
    ensure_database_upgrades()
    raw_connection = sqlite3.connect(DB_PATH, timeout=10)
    raw_connection.execute("PRAGMA journal_mode = OFF")
    raw_connection.execute("PRAGMA synchronous = OFF")
    raw_connection.row_factory = sqlite3.Row
    raw_connection.execute("PRAGMA busy_timeout = 5000")
    raw_connection.execute("PRAGMA foreign_keys = ON")
    return DatabaseConnection(raw_connection, "sqlite")


def row_to_dict(row: sqlite3.Row | dict[str, Any] | None) -> dict[str, Any] | None:
    return dict(row) if row else None


def today() -> str:
    return date.today().isoformat()


def required(payload: dict[str, Any], key: str) -> Any:
    value = payload.get(key)
    if value is None or value == "":
        raise ApiError(400, f"Falta el campo: {key}")
    return value


def as_int(value: Any, field: str) -> int:
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise ApiError(400, f"El campo {field} debe ser un numero entero.") from exc


def as_float(value: Any, field: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ApiError(400, f"El campo {field} debe ser numerico.") from exc


def as_optional_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    return float(value)


def profile_from_row(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "userId": row["user_id"],
        "name": row["name"],
        "email": row["email"],
        "height": row["height_cm"],
        "initialWeight": row["initial_weight_kg"],
        "targetWeight": row["target_weight_kg"],
        "age": row["age"],
        "activity": row["activity_level"],
        "calorieGoal": row["calorie_goal_kcal"],
        "updatedAt": row["updated_at"],
    }


def weight_from_row(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "date": row["entry_date"],
        "weight": row["weight_kg"],
        "notes": row["notes"] or "",
        "createdAt": row["created_at"],
    }


def exercise_from_row(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "date": row["entry_date"],
        "type": row["activity_type"],
        "duration": row["duration_minutes"],
        "intensity": row["intensity"],
        "calories": row["calories_burned"],
        "notes": row["notes"] or "",
        "createdAt": row["created_at"],
    }


def nutrition_from_row(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "date": row["entry_date"],
        "calories": row["calories_consumed"],
        "protein": row["protein_g"],
        "carbs": row["carbs_g"],
        "fat": row["fat_g"],
        "notes": row["notes"] or "",
        "createdAt": row["created_at"],
    }


def routine_task_from_row(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "planId": row["plan_id"],
        "day": row["day_of_week"],
        "name": row["activity_name"],
        "duration": row["duration_label"] or "",
        "status": row["status"],
        "sortOrder": row["sort_order"],
    }


def habit_from_row(row: sqlite3.Row, completions: list[str] | None = None) -> dict[str, Any]:
    dates = completions or []
    return {
        "id": row["id"],
        "name": row["name"],
        "frequency": row["frequency"],
        "active": bool(row["active"]),
        "createdAt": row["created_at"],
        "completions": dates,
        "completionMap": {completion_date: True for completion_date in dates},
    }


def goal_from_row(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "title": row["title"],
        "targetWeight": row["target_weight_kg"],
        "targetDate": row["target_date"],
        "status": row["status"],
        "createdAt": row["created_at"],
    }


def achievement_from_row(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "key": row["achievement_key"],
        "name": row["name"],
        "description": row["description"],
        "condition": row["condition_text"],
        "unlockedAt": row["unlocked_at"],
        "unlocked": row["unlocked_at"] is not None,
    }


class TrackFitHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:
        if self.is_api_request():
            self.handle_api("GET")
            return
        super().do_GET()

    def do_POST(self) -> None:
        self.handle_api("POST")

    def do_PUT(self) -> None:
        self.handle_api("PUT")

    def do_DELETE(self) -> None:
        self.handle_api("DELETE")

    def log_message(self, format: str, *args: Any) -> None:
        print(f"{self.address_string()} - {format % args}")

    def is_api_request(self) -> bool:
        return urlparse(self.path).path.startswith("/api")

    def handle_api(self, method: str) -> None:
        try:
            data = self.dispatch_api(method)
            self.send_json(data)
        except ApiError as exc:
            self.send_json({"error": exc.message}, exc.status)
        except Exception as exc:
            self.send_json({"error": f"Error interno: {exc}"}, 500)

    def dispatch_api(self, method: str) -> Any:
        parsed = urlparse(self.path)
        parts = [part for part in parsed.path.split("/") if part]
        query = parse_qs(parsed.query)

        if len(parts) < 2 or parts[0] != "api":
            raise ApiError(404, "Ruta no encontrada.")

        resource = parts[1]
        item_id = self.parse_id(parts[2]) if len(parts) >= 3 and parts[2].isdigit() else None
        extra = parts[3:] if len(parts) >= 4 else []

        if resource == "health" and method == "GET":
            return self.get_health()

        if resource == "auth":
            action = parts[2] if len(parts) >= 3 else ""
            if action == "login" and method == "POST":
                return self.login(self.read_json())
            if action == "register" and method == "POST":
                return self.register(self.read_json())
            if action == "me" and method == "GET":
                self.user_id = self.require_user()
                return self.get_auth_user()
            if action == "logout" and method == "POST":
                return self.logout()

        self.user_id = self.require_user()

        if resource == "dashboard" and method == "GET":
            return self.get_dashboard()

        if resource == "profile":
            if method == "GET":
                return self.get_profile()
            if method == "PUT":
                return self.update_profile(self.read_json())

        if resource == "weights":
            if method == "GET":
                return self.list_weights(query)
            if method == "POST":
                return self.create_weight(self.read_json())
            if item_id is not None and method == "PUT":
                return self.update_weight(item_id, self.read_json())
            if item_id is not None and method == "DELETE":
                return self.delete_weight(item_id)

        if resource == "exercises":
            if method == "GET":
                return self.list_exercises(query)
            if method == "POST":
                return self.create_exercise(self.read_json())
            if item_id is not None and method == "PUT":
                return self.update_exercise(item_id, self.read_json())
            if item_id is not None and method == "DELETE":
                return self.delete_exercise(item_id)

        if resource == "calories":
            if method == "GET":
                return self.list_nutrition(query)
            if method == "POST":
                return self.create_nutrition(self.read_json())
            if item_id is not None and method == "PUT":
                return self.update_nutrition(item_id, self.read_json())
            if item_id is not None and method == "DELETE":
                return self.delete_nutrition(item_id)

        if resource == "routine":
            if method == "GET":
                return self.list_routine()
            if method == "POST":
                return self.create_routine_task(self.read_json())
            if item_id is not None and method == "PUT":
                return self.update_routine_task(item_id, self.read_json())
            if item_id is not None and method == "DELETE":
                return self.delete_routine_task(item_id)

        if resource == "habits":
            if method == "GET":
                return self.list_habits()
            if method == "POST":
                return self.create_habit(self.read_json())
            if item_id is not None and extra == ["toggle"] and method == "POST":
                return self.toggle_habit(item_id, self.read_json())
            if item_id is not None and method == "PUT":
                return self.update_habit(item_id, self.read_json())
            if item_id is not None and method == "DELETE":
                return self.delete_habit(item_id)

        if resource == "goals":
            if method == "GET":
                return self.list_goals()
            if method == "POST":
                return self.create_goal(self.read_json())
            if item_id is not None and method == "PUT":
                return self.update_goal(item_id, self.read_json())
            if item_id is not None and method == "DELETE":
                return self.delete_goal(item_id)

        if resource == "achievements" and method == "GET":
            return self.list_achievements()

        raise ApiError(404, "Ruta no encontrada.")

    def parse_id(self, raw_id: str) -> int:
        try:
            return int(raw_id)
        except ValueError as exc:
            raise ApiError(400, "El id debe ser numerico.") from exc

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length == 0:
            return {}

        raw_body = self.rfile.read(length).decode("utf-8")
        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError as exc:
            raise ApiError(400, "JSON invalido.") from exc

        if not isinstance(payload, dict):
            raise ApiError(400, "El cuerpo debe ser un objeto JSON.")
        return payload

    def send_json(self, data: Any, status: int = 200) -> None:
        body = json.dumps(data, ensure_ascii=False, indent=2, default=json_default).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def auth_token(self) -> str | None:
        header = self.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return None
        return header.removeprefix("Bearer ").strip()

    def require_user(self) -> int:
        token = self.auth_token()
        user_id = SESSIONS.get(token or "")
        if not user_id:
            raise ApiError(401, "Inicia sesión para continuar.")
        return user_id

    def login(self, payload: dict[str, Any]) -> dict[str, Any]:
        email = str(required(payload, "email")).strip().lower()
        password = str(required(payload, "password"))

        with connect() as connection:
            row = connection.execute(
                "SELECT * FROM users WHERE lower(email) = ?",
                (email,),
            ).fetchone()

        if not row or not verify_password(password, row["password_hash"]):
            raise ApiError(401, "Email o contraseña incorrectos.")

        token = secrets.token_urlsafe(32)
        SESSIONS[token] = row["id"]
        return {"token": token, "user": public_user(row)}

    def register(self, payload: dict[str, Any]) -> dict[str, Any]:
        name = str(required(payload, "name")).strip()
        email = str(required(payload, "email")).strip().lower()
        password = str(required(payload, "password"))

        validate_full_name(name)
        validate_email(email)
        validate_password(password)

        with connect() as connection:
            existing = connection.execute(
                "SELECT id FROM users WHERE lower(email) = ?",
                (email,),
            ).fetchone()
            if existing:
                raise ApiError(409, "Ya existe una cuenta con ese email.")

            cursor = connection.execute(
                "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
                (name, email, hash_password(password)),
            )
            user_id = cursor.lastrowid
            connection.execute(
                """
                INSERT INTO user_profiles (
                  user_id,
                  height_cm,
                  initial_weight_kg,
                  target_weight_kg,
                  age,
                  activity_level,
                  calorie_goal_kcal
                )
                VALUES (?, 170, 80, 75, 30, 'Moderado', 2200)
                """,
                (user_id,),
            )
            connection.execute(
                """
                INSERT INTO routine_plans (user_id, name, objective, active)
                VALUES (?, 'Rutina principal', 'Plan semanal de TrackFit', 1)
                """,
                (user_id,),
            )
            row = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            connection.commit()

        token = secrets.token_urlsafe(32)
        SESSIONS[token] = user_id
        return {"token": token, "user": public_user(row)}

    def get_auth_user(self) -> dict[str, Any]:
        with connect() as connection:
            row = connection.execute(
                "SELECT * FROM users WHERE id = ?",
                (self.user_id,),
            ).fetchone()

        if not row:
            raise ApiError(401, "Sesión inválida.")
        return {"user": public_user(row)}

    def logout(self) -> dict[str, Any]:
        token = self.auth_token()
        if token:
            SESSIONS.pop(token, None)
        return {"ok": True}
    def get_health(self) -> dict[str, Any]:
        with connect() as connection:
            if DB_ENGINE == "mysql":
                tables = connection.execute(
                    """
                    SELECT COUNT(*) AS total
                    FROM information_schema.tables
                    WHERE table_schema = ?
                    """,
                    (MYSQL_DATABASE,),
                ).fetchone()["total"]
                database = MYSQL_DATABASE
            else:
                tables = connection.execute(
                    "SELECT COUNT(*) AS total FROM sqlite_master WHERE type = 'table'"
                ).fetchone()["total"]
                database = str(DB_PATH)
        return {"ok": True, "engine": DB_ENGINE, "database": database, "tables": tables}

    def get_dashboard(self) -> dict[str, Any]:
        return {
            "profile": self.get_profile(),
            "weights": self.list_weights({}),
            "exercises": self.list_exercises({}),
            "calories": self.list_nutrition({}),
            "routine": self.list_routine(),
            "habits": self.list_habits(),
            "goals": self.list_goals(),
            "achievements": self.list_achievements(),
        }

    def get_profile(self) -> dict[str, Any]:
        with connect() as connection:
            row = connection.execute(
                """
                SELECT
                  u.id AS user_id,
                  u.name,
                  u.email,
                  p.height_cm,
                  p.initial_weight_kg,
                  p.target_weight_kg,
                  p.age,
                  p.activity_level,
                  p.calorie_goal_kcal,
                  p.updated_at
                FROM users u
                JOIN user_profiles p ON p.user_id = u.id
                WHERE u.id = ?
                """,
                (self.user_id,),
            ).fetchone()

        if not row:
            raise ApiError(404, "Perfil no encontrado.")
        return profile_from_row(row)

    def update_profile(self, payload: dict[str, Any]) -> dict[str, Any]:
        current = self.get_profile()
        name = payload.get("name", current["name"])
        email = payload.get("email", current["email"])
        height = as_int(payload.get("height", current["height"]), "height")
        initial_weight = as_float(
            payload.get("initialWeight", current["initialWeight"]), "initialWeight"
        )
        target_weight = as_float(
            payload.get("targetWeight", current["targetWeight"]), "targetWeight"
        )
        age = as_int(payload.get("age", current["age"]), "age")
        activity = payload.get("activity", current["activity"])
        calorie_goal = as_int(payload.get("calorieGoal", current["calorieGoal"]), "calorieGoal")

        with connect() as connection:
            connection.execute(
                "UPDATE users SET name = ?, email = ? WHERE id = ?",
                (name, email, self.user_id),
            )
            connection.execute(
                """
                INSERT INTO user_profiles (
                  user_id,
                  height_cm,
                  initial_weight_kg,
                  target_weight_kg,
                  age,
                  activity_level,
                  calorie_goal_kcal,
                  updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                  height_cm = excluded.height_cm,
                  initial_weight_kg = excluded.initial_weight_kg,
                  target_weight_kg = excluded.target_weight_kg,
                  age = excluded.age,
                  activity_level = excluded.activity_level,
                  calorie_goal_kcal = excluded.calorie_goal_kcal,
                  updated_at = CURRENT_TIMESTAMP
                """,
                (
                    self.user_id,
                    height,
                    initial_weight,
                    target_weight,
                    age,
                    activity,
                    calorie_goal,
                ),
            )
            connection.commit()

        return self.get_profile()

    def list_weights(self, query: dict[str, list[str]]) -> list[dict[str, Any]]:
        limit = self.limit_from_query(query)
        with connect() as connection:
            rows = connection.execute(
                """
                SELECT * FROM weight_entries
                WHERE user_id = ?
                ORDER BY entry_date DESC
                LIMIT ?
                """,
                (self.user_id, limit),
            ).fetchall()
        return [weight_from_row(row) for row in rows]

    def create_weight(self, payload: dict[str, Any]) -> dict[str, Any]:
        entry_date = payload.get("date") or today()
        weight = as_float(required(payload, "weight"), "weight")
        notes = payload.get("notes", "")

        with connect() as connection:
            connection.execute(
                """
                INSERT INTO weight_entries (user_id, entry_date, weight_kg, notes)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id, entry_date) DO UPDATE SET
                  weight_kg = excluded.weight_kg,
                  notes = excluded.notes
                """,
                (self.user_id, entry_date, weight, notes),
            )
            row = connection.execute(
                """
                SELECT * FROM weight_entries
                WHERE user_id = ? AND entry_date = ?
                """,
                (self.user_id, entry_date),
            ).fetchone()
            connection.commit()
        return weight_from_row(row)

    def update_weight(self, item_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        current = self.find_weight(item_id)
        entry_date = payload.get("date", current["date"])
        weight = as_float(payload.get("weight", current["weight"]), "weight")
        notes = payload.get("notes", current["notes"])

        with connect() as connection:
            connection.execute(
                """
                UPDATE weight_entries
                SET entry_date = ?, weight_kg = ?, notes = ?
                WHERE id = ? AND user_id = ?
                """,
                (entry_date, weight, notes, item_id, self.user_id),
            )
            connection.commit()
        return self.find_weight(item_id)

    def delete_weight(self, item_id: int) -> dict[str, Any]:
        with connect() as connection:
            cursor = connection.execute(
                "DELETE FROM weight_entries WHERE id = ? AND user_id = ?",
                (item_id, self.user_id),
            )
            connection.commit()
        if cursor.rowcount == 0:
            raise ApiError(404, "Registro de peso no encontrado.")
        return {"deleted": True, "id": item_id}

    def find_weight(self, item_id: int) -> dict[str, Any]:
        with connect() as connection:
            row = connection.execute(
                "SELECT * FROM weight_entries WHERE id = ? AND user_id = ?",
                (item_id, self.user_id),
            ).fetchone()
        if not row:
            raise ApiError(404, "Registro de peso no encontrado.")
        return weight_from_row(row)

    def list_exercises(self, query: dict[str, list[str]]) -> list[dict[str, Any]]:
        limit = self.limit_from_query(query)
        with connect() as connection:
            rows = connection.execute(
                """
                SELECT * FROM exercise_entries
                WHERE user_id = ?
                ORDER BY entry_date DESC, id DESC
                LIMIT ?
                """,
                (self.user_id, limit),
            ).fetchall()
        return [exercise_from_row(row) for row in rows]

    def create_exercise(self, payload: dict[str, Any]) -> dict[str, Any]:
        entry_date = payload.get("date") or today()
        activity_type = payload.get("type") or payload.get("activity") or required(payload, "type")
        duration = as_int(required(payload, "duration"), "duration")
        intensity = payload.get("intensity", "Media")
        calories = as_int(payload.get("calories", 0), "calories")
        notes = payload.get("notes", "")

        with connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO exercise_entries (
                  user_id,
                  entry_date,
                  activity_type,
                  duration_minutes,
                  intensity,
                  calories_burned,
                  notes
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (self.user_id, entry_date, activity_type, duration, intensity, calories, notes),
            )
            connection.commit()
        return self.find_exercise(cursor.lastrowid)

    def update_exercise(self, item_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        current = self.find_exercise(item_id)
        entry_date = payload.get("date", current["date"])
        activity_type = payload.get("type", current["type"])
        duration = as_int(payload.get("duration", current["duration"]), "duration")
        intensity = payload.get("intensity", current["intensity"])
        calories = as_int(payload.get("calories", current["calories"]), "calories")
        notes = payload.get("notes", current["notes"])

        with connect() as connection:
            connection.execute(
                """
                UPDATE exercise_entries
                SET
                  entry_date = ?,
                  activity_type = ?,
                  duration_minutes = ?,
                  intensity = ?,
                  calories_burned = ?,
                  notes = ?
                WHERE id = ? AND user_id = ?
                """,
                (entry_date, activity_type, duration, intensity, calories, notes, item_id, self.user_id),
            )
            connection.commit()
        return self.find_exercise(item_id)

    def delete_exercise(self, item_id: int) -> dict[str, Any]:
        with connect() as connection:
            cursor = connection.execute(
                "DELETE FROM exercise_entries WHERE id = ? AND user_id = ?",
                (item_id, self.user_id),
            )
            connection.commit()
        if cursor.rowcount == 0:
            raise ApiError(404, "Entrenamiento no encontrado.")
        return {"deleted": True, "id": item_id}

    def find_exercise(self, item_id: int) -> dict[str, Any]:
        with connect() as connection:
            row = connection.execute(
                "SELECT * FROM exercise_entries WHERE id = ? AND user_id = ?",
                (item_id, self.user_id),
            ).fetchone()
        if not row:
            raise ApiError(404, "Entrenamiento no encontrado.")
        return exercise_from_row(row)

    def list_nutrition(self, query: dict[str, list[str]]) -> list[dict[str, Any]]:
        limit = self.limit_from_query(query)
        with connect() as connection:
            rows = connection.execute(
                """
                SELECT * FROM nutrition_entries
                WHERE user_id = ?
                ORDER BY entry_date DESC
                LIMIT ?
                """,
                (self.user_id, limit),
            ).fetchall()
        return [nutrition_from_row(row) for row in rows]

    def create_nutrition(self, payload: dict[str, Any]) -> dict[str, Any]:
        entry_date = payload.get("date") or today()
        calories = as_int(required(payload, "calories"), "calories")
        protein = as_int(payload.get("protein", 0), "protein")
        carbs = as_int(payload.get("carbs", 0), "carbs")
        fat = as_int(payload.get("fat", 0), "fat")
        notes = payload.get("notes", "")

        with connect() as connection:
            connection.execute(
                """
                INSERT INTO nutrition_entries (
                  user_id,
                  entry_date,
                  calories_consumed,
                  protein_g,
                  carbs_g,
                  fat_g,
                  notes
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, entry_date) DO UPDATE SET
                  calories_consumed = excluded.calories_consumed,
                  protein_g = excluded.protein_g,
                  carbs_g = excluded.carbs_g,
                  fat_g = excluded.fat_g,
                  notes = excluded.notes
                """,
                (self.user_id, entry_date, calories, protein, carbs, fat, notes),
            )
            row = connection.execute(
                """
                SELECT * FROM nutrition_entries
                WHERE user_id = ? AND entry_date = ?
                """,
                (self.user_id, entry_date),
            ).fetchone()
            connection.commit()
        return nutrition_from_row(row)

    def update_nutrition(self, item_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        current = self.find_nutrition(item_id)
        entry_date = payload.get("date", current["date"])
        calories = as_int(payload.get("calories", current["calories"]), "calories")
        protein = as_int(payload.get("protein", current["protein"]), "protein")
        carbs = as_int(payload.get("carbs", current["carbs"]), "carbs")
        fat = as_int(payload.get("fat", current["fat"]), "fat")
        notes = payload.get("notes", current["notes"])

        with connect() as connection:
            connection.execute(
                """
                UPDATE nutrition_entries
                SET
                  entry_date = ?,
                  calories_consumed = ?,
                  protein_g = ?,
                  carbs_g = ?,
                  fat_g = ?,
                  notes = ?
                WHERE id = ? AND user_id = ?
                """,
                (entry_date, calories, protein, carbs, fat, notes, item_id, self.user_id),
            )
            connection.commit()
        return self.find_nutrition(item_id)

    def delete_nutrition(self, item_id: int) -> dict[str, Any]:
        with connect() as connection:
            cursor = connection.execute(
                "DELETE FROM nutrition_entries WHERE id = ? AND user_id = ?",
                (item_id, self.user_id),
            )
            connection.commit()
        if cursor.rowcount == 0:
            raise ApiError(404, "Registro nutricional no encontrado.")
        return {"deleted": True, "id": item_id}

    def find_nutrition(self, item_id: int) -> dict[str, Any]:
        with connect() as connection:
            row = connection.execute(
                "SELECT * FROM nutrition_entries WHERE id = ? AND user_id = ?",
                (item_id, self.user_id),
            ).fetchone()
        if not row:
            raise ApiError(404, "Registro nutricional no encontrado.")
        return nutrition_from_row(row)

    def get_active_plan(self) -> dict[str, Any]:
        with connect() as connection:
            row = connection.execute(
                """
                SELECT * FROM routine_plans
                WHERE user_id = ? AND active = 1
                ORDER BY id
                LIMIT 1
                """,
                (self.user_id,),
            ).fetchone()

            if row:
                return row_to_dict(row)

            cursor = connection.execute(
                """
                INSERT INTO routine_plans (user_id, name, objective, active)
                VALUES (?, ?, ?, 1)
                """,
                (self.user_id, "Rutina principal", "Plan semanal de TrackFit"),
            )
            connection.commit()
            created = connection.execute(
                "SELECT * FROM routine_plans WHERE id = ?",
                (cursor.lastrowid,),
            ).fetchone()
            return row_to_dict(created)

    def list_routine(self) -> dict[str, Any]:
        plan = self.get_active_plan()
        with connect() as connection:
            rows = connection.execute(
                """
                SELECT t.*
                FROM routine_tasks t
                WHERE t.plan_id = ?
                ORDER BY
                  CASE t.day_of_week
                    WHEN 'Lunes' THEN 1
                    WHEN 'Martes' THEN 2
                    WHEN 'Miércoles' THEN 3
                    WHEN 'Jueves' THEN 4
                    WHEN 'Viernes' THEN 5
                    WHEN 'Sábado' THEN 6
                    ELSE 7
                  END,
                  t.sort_order,
                  t.id
                """,
                (plan["id"],),
            ).fetchall()

        return {"plan": plan, "tasks": [routine_task_from_row(row) for row in rows]}

    def create_routine_task(self, payload: dict[str, Any]) -> dict[str, Any]:
        plan = self.get_active_plan()
        day = required(payload, "day")
        name = payload.get("name") or payload.get("activity") or required(payload, "name")
        duration = payload.get("duration", "")
        status = payload.get("status", "Pendiente")
        sort_order = as_int(payload.get("sortOrder", 0), "sortOrder")

        with connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO routine_tasks (
                  plan_id,
                  day_of_week,
                  activity_name,
                  duration_label,
                  status,
                  sort_order
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (plan["id"], day, name, duration, status, sort_order),
            )
            connection.commit()
        return self.find_routine_task(cursor.lastrowid)

    def update_routine_task(self, item_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        current = self.find_routine_task(item_id)
        day = payload.get("day", current["day"])
        name = payload.get("name", current["name"])
        duration = payload.get("duration", current["duration"])
        status = payload.get("status", current["status"])
        sort_order = as_int(payload.get("sortOrder", current["sortOrder"]), "sortOrder")

        with connect() as connection:
            connection.execute(
                """
                UPDATE routine_tasks
                SET
                  day_of_week = ?,
                  activity_name = ?,
                  duration_label = ?,
                  status = ?,
                  sort_order = ?
                WHERE id = ?
                  AND plan_id IN (SELECT id FROM routine_plans WHERE user_id = ?)
                """,
                (day, name, duration, status, sort_order, item_id, self.user_id),
            )
            connection.commit()
        return self.find_routine_task(item_id)

    def delete_routine_task(self, item_id: int) -> dict[str, Any]:
        with connect() as connection:
            cursor = connection.execute(
                """
                DELETE FROM routine_tasks
                WHERE id = ?
                  AND plan_id IN (SELECT id FROM routine_plans WHERE user_id = ?)
                """,
                (item_id, self.user_id),
            )
            connection.commit()
        if cursor.rowcount == 0:
            raise ApiError(404, "Actividad de rutina no encontrada.")
        return {"deleted": True, "id": item_id}

    def find_routine_task(self, item_id: int) -> dict[str, Any]:
        with connect() as connection:
            row = connection.execute(
                """
                SELECT t.*
                FROM routine_tasks t
                JOIN routine_plans p ON p.id = t.plan_id
                WHERE t.id = ? AND p.user_id = ?
                """,
                (item_id, self.user_id),
            ).fetchone()
        if not row:
            raise ApiError(404, "Actividad de rutina no encontrada.")
        return routine_task_from_row(row)

    def list_habits(self) -> list[dict[str, Any]]:
        with connect() as connection:
            habits = connection.execute(
                """
                SELECT * FROM habits
                WHERE user_id = ?
                ORDER BY active DESC, id
                """,
                (self.user_id,),
            ).fetchall()
            completions = connection.execute(
                """
                SELECT h.id AS habit_id, hc.completion_date
                FROM habit_completions hc
                JOIN habits h ON h.id = hc.habit_id
                WHERE h.user_id = ? AND hc.completed = 1
                ORDER BY hc.completion_date
                """,
                (self.user_id,),
            ).fetchall()

        completion_map: dict[int, list[str]] = {}
        for row in completions:
            completion_map.setdefault(row["habit_id"], []).append(row["completion_date"])

        return [habit_from_row(row, completion_map.get(row["id"], [])) for row in habits]

    def create_habit(self, payload: dict[str, Any]) -> dict[str, Any]:
        name = required(payload, "name")
        frequency = payload.get("frequency", "Diario")
        active = 1 if payload.get("active", True) else 0

        with connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO habits (user_id, name, frequency, active)
                VALUES (?, ?, ?, ?)
                """,
                (self.user_id, name, frequency, active),
            )
            connection.commit()
        return self.find_habit(cursor.lastrowid)

    def update_habit(self, item_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        current = self.find_habit(item_id)
        name = payload.get("name", current["name"])
        frequency = payload.get("frequency", current["frequency"])
        active = payload.get("active", current["active"])
        active_value = 1 if active else 0

        with connect() as connection:
            connection.execute(
                """
                UPDATE habits
                SET name = ?, frequency = ?, active = ?
                WHERE id = ? AND user_id = ?
                """,
                (name, frequency, active_value, item_id, self.user_id),
            )
            connection.commit()
        return self.find_habit(item_id)

    def delete_habit(self, item_id: int) -> dict[str, Any]:
        with connect() as connection:
            cursor = connection.execute(
                "DELETE FROM habits WHERE id = ? AND user_id = ?",
                (item_id, self.user_id),
            )
            connection.commit()
        if cursor.rowcount == 0:
            raise ApiError(404, "Habito no encontrado.")
        return {"deleted": True, "id": item_id}

    def toggle_habit(self, item_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        self.find_habit(item_id)
        completion_date = payload.get("date") or today()

        with connect() as connection:
            existing = connection.execute(
                """
                SELECT id FROM habit_completions
                WHERE habit_id = ? AND completion_date = ? AND completed = 1
                """,
                (item_id, completion_date),
            ).fetchone()

            if existing:
                connection.execute(
                    """
                    DELETE FROM habit_completions
                    WHERE habit_id = ? AND completion_date = ?
                    """,
                    (item_id, completion_date),
                )
                completed = False
            else:
                connection.execute(
                    """
                    INSERT INTO habit_completions (habit_id, completion_date, completed)
                    VALUES (?, ?, 1)
                    ON CONFLICT(habit_id, completion_date) DO UPDATE SET completed = 1
                    """,
                    (item_id, completion_date),
                )
                completed = True

            connection.commit()

        return {"habitId": item_id, "date": completion_date, "completed": completed}

    def find_habit(self, item_id: int) -> dict[str, Any]:
        with connect() as connection:
            row = connection.execute(
                "SELECT * FROM habits WHERE id = ? AND user_id = ?",
                (item_id, self.user_id),
            ).fetchone()
            completions = connection.execute(
                """
                SELECT completion_date
                FROM habit_completions
                WHERE habit_id = ? AND completed = 1
                ORDER BY completion_date
                """,
                (item_id,),
            ).fetchall()
        if not row:
            raise ApiError(404, "Habito no encontrado.")
        return habit_from_row(row, [item["completion_date"] for item in completions])

    def list_goals(self) -> list[dict[str, Any]]:
        with connect() as connection:
            rows = connection.execute(
                """
                SELECT * FROM goals
                WHERE user_id = ?
                ORDER BY
                  CASE status
                    WHEN 'Activa' THEN 1
                    WHEN 'Pausada' THEN 2
                    WHEN 'Completada' THEN 3
                    ELSE 4
                  END,
                  target_date
                """,
                (self.user_id,),
            ).fetchall()
        return [goal_from_row(row) for row in rows]

    def create_goal(self, payload: dict[str, Any]) -> dict[str, Any]:
        title = required(payload, "title")
        target_weight = as_optional_float(payload.get("targetWeight"))
        target_date = payload.get("targetDate") or payload.get("date") or required(payload, "targetDate")
        status = payload.get("status", "Activa")

        with connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO goals (user_id, title, target_weight_kg, target_date, status)
                VALUES (?, ?, ?, ?, ?)
                """,
                (self.user_id, title, target_weight, target_date, status),
            )
            connection.commit()
        return self.find_goal(cursor.lastrowid)

    def update_goal(self, item_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        current = self.find_goal(item_id)
        title = payload.get("title", current["title"])
        target_weight = as_optional_float(payload.get("targetWeight", current["targetWeight"]))
        target_date = payload.get("targetDate", current["targetDate"])
        status = payload.get("status", current["status"])

        with connect() as connection:
            connection.execute(
                """
                UPDATE goals
                SET title = ?, target_weight_kg = ?, target_date = ?, status = ?
                WHERE id = ? AND user_id = ?
                """,
                (title, target_weight, target_date, status, item_id, self.user_id),
            )
            connection.commit()
        return self.find_goal(item_id)

    def delete_goal(self, item_id: int) -> dict[str, Any]:
        with connect() as connection:
            cursor = connection.execute(
                "DELETE FROM goals WHERE id = ? AND user_id = ?",
                (item_id, self.user_id),
            )
            connection.commit()
        if cursor.rowcount == 0:
            raise ApiError(404, "Meta no encontrada.")
        return {"deleted": True, "id": item_id}

    def find_goal(self, item_id: int) -> dict[str, Any]:
        with connect() as connection:
            row = connection.execute(
                "SELECT * FROM goals WHERE id = ? AND user_id = ?",
                (item_id, self.user_id),
            ).fetchone()
        if not row:
            raise ApiError(404, "Meta no encontrada.")
        return goal_from_row(row)

    def list_achievements(self) -> list[dict[str, Any]]:
        with connect() as connection:
            rows = connection.execute(
                """
                SELECT
                  a.*,
                  ua.unlocked_at
                FROM achievements a
                LEFT JOIN user_achievements ua
                  ON ua.achievement_id = a.id
                  AND ua.user_id = ?
                ORDER BY a.id
                """,
                (self.user_id,),
            ).fetchall()
        return [achievement_from_row(row) for row in rows]

    def limit_from_query(self, query: dict[str, list[str]]) -> int:
        raw_limit = query.get("limit", ["100"])[0]
        try:
            return max(1, min(int(raw_limit), 500))
        except ValueError:
            raise ApiError(400, "El parametro limit debe ser numerico.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Servidor local para TrackFit")
    parser.add_argument("--host", default="127.0.0.1", help="Host del servidor")
    parser.add_argument("--port", type=int, default=8000, help="Puerto del servidor")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    server = ThreadingHTTPServer((args.host, args.port), TrackFitHandler)
    print(f"TrackFit listo en http://{args.host}:{args.port}")
    print(f"API disponible en http://{args.host}:{args.port}/api/health")
    server.serve_forever()


if __name__ == "__main__":
    main()

