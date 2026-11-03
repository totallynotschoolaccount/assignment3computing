# database.py
# Saves every check in a small SQLite database, so each user can see their own history.
# Every query uses ? placeholders, so the input is always data and never part of the SQL


import os
import sqlite3
from datetime import datetime

DB_PATH = os.environ.get("DB_PATH", "history.db")


def connect():
    # check_same_thread=False because FastAPI can open the connection in one thread
    # and use it in another. Each request still gets its own connection.
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def create_table():
    conn = connect()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS checks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            url TEXT NOT NULL,
            label TEXT NOT NULL,
            confidence REAL NOT NULL,
            score INTEGER NOT NULL,
            risk_level TEXT NOT NULL,
            checked_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def get_db():
    # FastAPI gives each request its own connection and closes it afterwards
    conn = connect()
    try:
        yield conn
    finally:
        conn.close()


def save_check(conn, session_id, result):
    checked_at = datetime.now().isoformat(timespec="seconds")
    conn.execute(
        "INSERT INTO checks (session_id, url, label, confidence, score, risk_level, checked_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (session_id, result["url"], result["label"], result["confidence"],
         result["score"], result["risk_level"], checked_at),
    )
    conn.commit()


def get_history(conn, session_id):
    rows = conn.execute(
        "SELECT id, url, label, confidence, score, risk_level, checked_at "
        "FROM checks WHERE session_id = ? ORDER BY id",
        (session_id,),
    ).fetchall()
    return [dict(row) for row in rows]


def delete_history(conn, session_id):
    cur = conn.execute("DELETE FROM checks WHERE session_id = ?", (session_id,))
    conn.commit()
    return cur.rowcount