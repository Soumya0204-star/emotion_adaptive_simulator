"""
database/db_manager.py

SQLite persistence layer for the Emotion-Aware Adaptive Human Interaction
Simulator. Stores one row per completed session with aggregate metrics,
used by the Phase 4 Progress Dashboard.

EXPERIMENT UPDATE: Added 'mode' and 'user_id' columns for Baseline vs Adaptive comparison.
"""

import sqlite3
import os
from datetime import datetime
from typing import Optional, List, Dict, Any

DB_PATH = os.path.join(os.path.dirname(__file__), "simulator.db")


class DatabaseManager:
    """Handles all SQLite reads/writes for session records."""

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self.create_tables()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def create_tables(self) -> None:
        """Create the sessions table if it doesn't already exist."""
        with self._get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT UNIQUE NOT NULL,
                    user_id TEXT DEFAULT 'P001',
                    user_name TEXT DEFAULT 'Anonymous',
                    role TEXT,
                    difficulty TEXT,
                    mode TEXT DEFAULT 'adaptive',
                    start_time TIMESTAMP,
                    end_time TIMESTAMP,
                    avg_quality REAL,
                    avg_confidence REAL,
                    avg_stress REAL,
                    avg_engagement REAL,
                    avg_relevance REAL,
                    final_skill_level TEXT,
                    total_exchanges INTEGER
                )
                """
            )
            conn.commit()

    def save_session(self, session_data: Dict[str, Any]) -> int:
        """
        Insert a completed session into the DB.

        session_data expected keys (missing keys fall back to sensible
        defaults so this is forgiving about partial data):
            session_id, user_id, user_name, role, difficulty, mode,
            start_time, end_time,
            avg_quality, avg_confidence, avg_stress,
            avg_engagement, avg_relevance,
            final_skill_level, total_exchanges

        Returns the row id of the inserted/updated record.
        """
        fields = {
            "session_id": session_data.get("session_id"),
            "user_id": session_data.get("user_id", "P001"),
            "user_name": session_data.get("user_name", "Anonymous"),
            "role": session_data.get("role"),
            "difficulty": session_data.get("difficulty"),
            "mode": session_data.get("mode", "adaptive"),
            "start_time": session_data.get("start_time"),
            "end_time": session_data.get("end_time", datetime.utcnow().isoformat()),
            "avg_quality": session_data.get("avg_quality"),
            "avg_confidence": session_data.get("avg_confidence"),
            "avg_stress": session_data.get("avg_stress"),
            "avg_engagement": session_data.get("avg_engagement"),
            "avg_relevance": session_data.get("avg_relevance"),
            "final_skill_level": session_data.get("final_skill_level"),
            "total_exchanges": session_data.get("total_exchanges", 0),
        }

        if not fields["session_id"]:
            raise ValueError("session_data must include a 'session_id'")

        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO sessions (
                    session_id, user_id, user_name, role, difficulty, mode,
                    start_time, end_time,
                    avg_quality, avg_confidence, avg_stress,
                    avg_engagement, avg_relevance,
                    final_skill_level, total_exchanges
                ) VALUES (
                    :session_id, :user_id, :user_name, :role, :difficulty, :mode,
                    :start_time, :end_time,
                    :avg_quality, :avg_confidence, :avg_stress,
                    :avg_engagement, :avg_relevance,
                    :final_skill_level, :total_exchanges
                )
                ON CONFLICT(session_id) DO UPDATE SET
                    user_id=excluded.user_id,
                    user_name=excluded.user_name,
                    role=excluded.role,
                    difficulty=excluded.difficulty,
                    mode=excluded.mode,
                    start_time=excluded.start_time,
                    end_time=excluded.end_time,
                    avg_quality=excluded.avg_quality,
                    avg_confidence=excluded.avg_confidence,
                    avg_stress=excluded.avg_stress,
                    avg_engagement=excluded.avg_engagement,
                    avg_relevance=excluded.avg_relevance,
                    final_skill_level=excluded.final_skill_level,
                    total_exchanges=excluded.total_exchanges
                """,
                fields,
            )
            conn.commit()
            cursor = conn.execute(
                "SELECT id FROM sessions WHERE session_id = ?",
                (fields["session_id"],),
            )
            row = cursor.fetchone()
            return row["id"] if row else -1

    def get_all_sessions(self) -> List[Dict[str, Any]]:
        """Retrieve all sessions, ordered oldest -> newest (for trend charts)."""
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT * FROM sessions ORDER BY start_time ASC")
            return [dict(row) for row in cursor.fetchall()]

    def get_session_by_id(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single session's stored summary."""
        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM sessions WHERE session_id = ?", (session_id,)
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def delete_session(self, session_id: str) -> bool:
        """Optional helper: remove a session record (e.g. for testing)."""
        with self._get_connection() as conn:
            cursor = conn.execute(
                "DELETE FROM sessions WHERE session_id = ?", (session_id,)
            )
            conn.commit()
            return cursor.rowcount > 0