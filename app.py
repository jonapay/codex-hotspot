from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Optional

from flask import Flask, redirect, render_template, request, session, url_for, flash
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "users.db"
SECRET_KEY_PATH = BASE_DIR / ".flask_secret_key"


def ensure_secret_key() -> str:
    """Load or create the Flask secret key."""
    if SECRET_KEY_PATH.exists():
        return SECRET_KEY_PATH.read_text().strip()

    key = generate_password_hash("codex-hotspot-secret-key")
    SECRET_KEY_PATH.write_text(key)
    return key


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["DATABASE"] = str(DATABASE_PATH)
    app.secret_key = ensure_secret_key()

    @app.before_request
    def init_db() -> None:
        """Ensure the database and default user exist before handling requests."""
        with sqlite3.connect(app.config["DATABASE"]) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL
                )
                """
            )
            cur = conn.execute("SELECT COUNT(*) FROM users")
            (count,) = cur.fetchone()
            if count == 0:
                conn.execute(
                    "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                    ("admin", generate_password_hash("passwort123")),
                )
                conn.commit()

    @app.route("/", methods=["GET"])
    def index() -> str:
        if session.get("user"):
            return render_template("dashboard.html", user=session["user"])
        return redirect(url_for("login"))

    @app.route("/login", methods=["GET", "POST"])
    def login() -> str:
        if request.method == "POST":
            username = request.form.get("username", "").strip()
            password = request.form.get("password", "")

            user = fetch_user(app.config["DATABASE"], username)
            if user and check_password_hash(user["password_hash"], password):
                session["user"] = user["username"]
                flash("Erfolgreich angemeldet.", "success")
                return redirect(url_for("index"))

            flash("Ungültiger Benutzername oder Passwort.", "error")

        return render_template("login.html")

    @app.route("/logout")
    def logout() -> str:
        session.pop("user", None)
        flash("Du wurdest abgemeldet.", "info")
        return redirect(url_for("login"))

    return app


def fetch_user(database_path: str, username: str) -> Optional[dict[str, str]]:
    """Retrieve a user row as a dict."""
    if not username:
        return None

    with sqlite3.connect(database_path) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.execute("SELECT username, password_hash FROM users WHERE username = ?", (username,))
        row = cur.fetchone()
        if row is None:
            return None
        return {"username": row["username"], "password_hash": row["password_hash"]}


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
