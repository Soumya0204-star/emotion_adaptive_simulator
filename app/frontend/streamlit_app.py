"""
app/frontend/streamlit_app.py

Main Streamlit entrypoint. Adds Phase 4 navigation:
  - "Chat" page: the existing Phase 1-3 conversation UI + a new
    "End Session" button that calls /end_session and shows the report.
  - "Dashboard" page: Phase 4 progress dashboard (dashboard.py).

EXPERIMENT UPDATE: Added 'Participant ID' text input and 'Baseline Mode' checkbox.
The checkbox disables the Adaptive Manager when checked.
"""

import sys
import os

# --- CRITICAL FIX: Add project root to Python's path ---
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import uuid
import requests
import streamlit as st

from app.frontend.dashboard import render_dashboard

API_BASE_URL = "http://localhost:8000"

st.set_page_config(page_title="Emotion-Aware Adaptive Simulator", layout="wide")

# ----------------------------------------------------------------------
# Session state bootstrap
# ----------------------------------------------------------------------
if "session_id" not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())
if "messages" not in st.session_state:
    st.session_state.messages = []
if "session_ended" not in st.session_state:
    st.session_state.session_ended = False
if "last_report" not in st.session_state:
    st.session_state.last_report = None


def start_new_session():
    st.session_state.session_id = str(uuid.uuid4())
    st.session_state.messages = []
    st.session_state.session_ended = False
    st.session_state.last_report = None


# ----------------------------------------------------------------------
# Sidebar: navigation + session controls + EXPERIMENT CONTROLS
# ----------------------------------------------------------------------
st.sidebar.title("Navigation")
page = st.sidebar.radio("Go to", ["Chat", "Dashboard"], index=0)

st.sidebar.divider()
st.sidebar.subheader("Session Setup")

# --- EXPERIMENT: Participant ID ---
user_id = st.sidebar.text_input("👤 Participant ID", value="P001", help="Unique ID for each participant.")

role = st.sidebar.text_input("Role", value="Data Scientist")
difficulty = st.sidebar.selectbox("Difficulty", ["Beginner", "Intermediate", "Advanced"], index=1)
user_name = st.sidebar.text_input("Your Name", value="Anonymous")

st.sidebar.divider()
st.sidebar.subheader("🔬 Experiment Mode")

# --- EXPERIMENT: Baseline Mode Toggle ---
is_baseline = st.sidebar.checkbox(
    "🔒 Baseline Mode (No Adaptation)",
    value=False,
    help="If checked, the AI will NOT adapt difficulty. Used for the control group."
)

if is_baseline:
    st.sidebar.warning("⚠️ Adaptation is DISABLED. The AI will ask standard follow-ups.")
else:
    st.sidebar.success("✅ Adaptation is ENABLED. The AI will adjust to your state.")

st.sidebar.divider()

if st.sidebar.button("🛑 End Session", use_container_width=True, disabled=st.session_state.session_ended):
    try:
        resp = requests.post(
            f"{API_BASE_URL}/end_session",
            json={"session_id": st.session_state.session_id},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        st.session_state.last_report = data["report"]
        st.session_state.session_ended = True
        st.sidebar.success("Session saved to dashboard.")
    except requests.RequestException as e:
        st.sidebar.error(f"Could not end session: {e}")

if st.sidebar.button("🔄 Start New Session", use_container_width=True):
    start_new_session()
    st.rerun()

# ----------------------------------------------------------------------
# Page routing
# ----------------------------------------------------------------------
if page == "Dashboard":
    render_dashboard()

else:
    st.title("🧠 Emotion-Aware Adaptive Interaction Simulator")
    
    # Show experiment mode indicator
    if is_baseline:
        st.caption(f"🔬 [BASELINE MODE] Session: `{st.session_state.session_id[:8]}` · Participant: {user_id} · Role: {role}")
    else:
        st.caption(f"🧠 [ADAPTIVE MODE] Session: `{st.session_state.session_id[:8]}` · Participant: {user_id} · Role: {role}")

    if st.session_state.last_report:
        st.subheader("📋 Interaction Report")
        st.code(st.session_state.last_report, language=None)
        st.download_button(
            "⬇️ Download Report (.txt)",
            data=st.session_state.last_report,
            file_name=f"session_{st.session_state.session_id[:8]}_report.txt",
            mime="text/plain",
        )
        st.info("Start a new session from the sidebar to continue practicing.")

    else:
        # --- Render chat history ---
        for msg in st.session_state.messages:
            with st.chat_message(msg["role"]):
                st.write(msg["content"])

        # --- Chat input ---
        user_input = st.chat_input("Type your response...", disabled=st.session_state.session_ended)

        if user_input:
            st.session_state.messages.append({"role": "user", "content": user_input})
            with st.chat_message("user"):
                st.write(user_input)

            try:
                resp = requests.post(
                    f"{API_BASE_URL}/chat",
                    json={
                        "session_id": st.session_state.session_id,
                        "message": user_input,
                        "role": role,
                        "difficulty": difficulty,
                        "user_name": user_name,
                        "user_id": user_id,
                        "is_baseline": is_baseline,
                    },
                    timeout=30,
                )
                resp.raise_for_status()
                data = resp.json()
                ai_reply = data["reply"]
            except requests.RequestException as e:
                ai_reply = f"⚠️ Error contacting backend: {e}"

            st.session_state.messages.append({"role": "assistant", "content": ai_reply})
            with st.chat_message("assistant"):
                st.write(ai_reply)