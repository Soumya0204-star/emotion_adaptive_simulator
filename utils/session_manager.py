"""
utils/session_manager.py

In-memory session state for active conversations.

Keeps two things per session_id:
  - a short rolling window of exchanges (last 5) used to build LLM context,
    same as Phase 1
  - the FULL list of per-exchange NLP analyses + adaptive decisions for the
    session's lifetime, used at /end_session time to compute averages for
    the database (Phase 4)

EXPERIMENT UPDATE: Added 'user_id' and 'mode' to session metadata.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any

MAX_HISTORY = 5


class SessionManager:
    def __init__(self):
        # session_id -> list of {"user": str, "ai": str} (max length MAX_HISTORY)
        self.history: Dict[str, List[Dict[str, str]]] = {}

        # session_id -> list of every analysis dict produced during the session
        # each entry: {quality, relevance, confidence, stress, hesitation,
        #              engagement, action, shift, reason, timestamp}
        self.analyses: Dict[str, List[Dict[str, Any]]] = {}

        # session_id -> metadata about the session
        # {"start_time": iso str, "role": str, "difficulty": str,
        #  "user_name": str, "user_id": str, "mode": str, "exchange_count": int}
        self.session_meta: Dict[str, Dict[str, Any]] = {}

    # ------------------------------------------------------------------
    # Session lifecycle
    # ------------------------------------------------------------------
    def start_session(
        self,
        session_id: str,
        role: str = "General",
        difficulty: str = "Intermediate",
        user_name: str = "Anonymous",
        user_id: str = "P001",
        mode: str = "adaptive",
    ) -> None:
        """Register a new session. Safe to call again (no-op if exists)."""
        if session_id in self.session_meta:
            return
        self.history[session_id] = []
        self.analyses[session_id] = []
        self.session_meta[session_id] = {
            "start_time": datetime.utcnow().isoformat(),
            "role": role,
            "difficulty": difficulty,
            "user_name": user_name,
            "user_id": user_id,
            "mode": mode,
            "exchange_count": 0,
        }

    def _ensure_session(self, session_id: str) -> None:
        if session_id not in self.session_meta:
            self.start_session(session_id)

    # ------------------------------------------------------------------
    # Exchange tracking
    # ------------------------------------------------------------------
    def add_exchange(self, session_id: str, user_msg: str, ai_msg: str) -> None:
        """Append an exchange to the rolling window (keeps only last 5)."""
        self._ensure_session(session_id)
        self.history[session_id].append({"user": user_msg, "ai": ai_msg})
        if len(self.history[session_id]) > MAX_HISTORY:
            self.history[session_id].pop(0)
        self.session_meta[session_id]["exchange_count"] += 1

    def add_analysis(self, session_id: str, analysis: Dict[str, Any]) -> None:
        """
        Store the NLP scores + adaptive decision for one exchange.
        Called once per turn from the chat endpoint, in addition to
        add_exchange(). Unlike history, this is NEVER trimmed — Phase 4
        needs the full-session average at /end_session time.
        """
        self._ensure_session(session_id)
        entry = dict(analysis)
        entry.setdefault("timestamp", datetime.utcnow().isoformat())
        self.analyses[session_id].append(entry)

    # ------------------------------------------------------------------
    # Accessors
    # ------------------------------------------------------------------
    def get_recent_history(self, session_id: str) -> List[Dict[str, str]]:
        """Returns the raw history as [{"user": "...", "ai": "..."}]."""
        return self.history.get(session_id, [])

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        """
        Returns the history in OpenAI format for the LLM.
        Converts [{"user": "...", "ai": "..."}] to
        [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
        """
        raw_history = self.history.get(session_id, [])
        formatted = []
        for exchange in raw_history:
            formatted.append({"role": "user", "content": exchange["user"]})
            formatted.append({"role": "assistant", "content": exchange["ai"]})
        return formatted

    def get_session_analyses(self, session_id: str) -> List[Dict[str, Any]]:
        return self.analyses.get(session_id, [])

    def get_session_meta(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self.session_meta.get(session_id)

    def get_exchange_count(self, session_id: str) -> int:
        meta = self.session_meta.get(session_id)
        return meta["exchange_count"] if meta else 0

    # ------------------------------------------------------------------
    # Cleanup
    # ------------------------------------------------------------------
    def clear_session(self, session_id: str) -> None:
        """Drop all in-memory state for a session (call after it's persisted)."""
        self.history.pop(session_id, None)
        self.analyses.pop(session_id, None)
        self.session_meta.pop(session_id, None)


# Single shared instance imported by chat.py and elsewhere
session_manager = SessionManager()