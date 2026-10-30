from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.backend.api import chat

app = FastAPI(title="Emotion-Aware Adaptive Human Interaction Simulator (Phase 1)")

# CORS: allow the Streamlit frontend (and localhost dev servers) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8501",
        "http://localhost:3000",
        "*",  # for testing only
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the /chat router
app.include_router(chat.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "Backend is running. POST to /chat to talk to the interviewer."}
