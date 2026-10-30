"""
app/backend/api/chat.py

Phase 3: /chat endpoint runs NLP analysis + adaptive decision, calls the LLM.
Phase 4: /end_session endpoint aggregates the session and persists it to
SQLite via DatabaseManager, then returns the summary + formatted report.

EXPERIMENT UPDATE: Added 'is_baseline' and 'user_id' to ChatRequest.
If is_baseline is True, the system bypasses the Adaptive Manager
and always sends ASK_FOLLOW_UP with no difficulty change.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from utils.session_manager import SessionManager
from modules.nlp.answer_quality import AnswerQualityScorer
from modules.nlp.technical_relevance import TechnicalRelevanceDetector
from modules.nlp.text_emotion import TextEmotionAnalyzer
from modules.dialogue.adaptive_manager import AdaptiveDialogueManager
from modules.dialogue.llm_interface import LLMInterface
from modules.reporting.report_generator import generate_report
from database.db_manager import DatabaseManager

router = APIRouter()

# --- Initialize all managers ---
session_manager = SessionManager()
quality_scorer = AnswerQualityScorer()
relevance_detector = TechnicalRelevanceDetector()
emotion_analyzer = TextEmotionAnalyzer()
adaptive_manager = AdaptiveDialogueManager()
llm_interface = LLMInterface()
db_manager = DatabaseManager()


class ChatRequest(BaseModel):
    session_id: str
    message: str
    role: Optional[str] = "General"
    difficulty: Optional[str] = "Intermediate"
    user_name: Optional[str] = "Anonymous"
    user_id: Optional[str] = "P001"
    is_baseline: bool = False  # EXPERIMENT: True = Baseline (No Adaptation)
    # Multimodal Vision Signals (Phase 6):
    face_confidence: Optional[float] = None
    face_stress: Optional[float] = None
    face_engagement: Optional[float] = None
    # Multimodal Voice Signals (Phase 6):
    voice_confidence: Optional[float] = None
    voice_stress: Optional[float] = None
    voice_engagement: Optional[float] = None


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    action: str
    reason: str


class EndSessionRequest(BaseModel):
    session_id: str


class EndSessionResponse(BaseModel):
    session_id: str
    summary: dict
    report: str


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    # Start/update session metadata
    session_manager.start_session(
        request.session_id,
        role=request.role,
        difficulty=request.difficulty,
        user_name=request.user_name,
        user_id=request.user_id,
        mode="baseline" if request.is_baseline else "adaptive",
    )

    history = session_manager.get_history(request.session_id)

    # --- Phase 2: NLP scoring using your existing classes ---
    quality_result = quality_scorer.score_answer(request.message)
    relevance_result = relevance_detector.detect(request.message, request.role)
    emotion_result = emotion_analyzer.analyze(request.message)

    # Extract scores for the adaptive manager
    quality_score = quality_result.get("score", 50)
    relevance_score = relevance_result.get("score", 50)
    emotion_scores = {
        "confidence": emotion_result.get("confidence", 50),
        "stress": emotion_result.get("stress", 50),
        "hesitation": emotion_result.get("hesitation", 50),
        "engagement": emotion_result.get("engagement", 50),
        "sentiment": emotion_result.get("sentiment", "neutral"),
    }

    if request.face_confidence is not None or request.face_stress is not None or request.face_engagement is not None:
        print("\n--- MULTIMODAL FACIAL EMOTION SIGNALS ---")
        print(f"Face Confidence: {request.face_confidence}% | Face Stress: {request.face_stress}% | Face Engagement: {request.face_engagement}%")

    if request.voice_confidence is not None or request.voice_stress is not None or request.voice_engagement is not None:
        print("\n--- MULTIMODAL VOICE EMOTION SIGNALS ---")
        print(f"Voice Confidence: {request.voice_confidence}% | Voice Stress: {request.voice_stress}% | Voice Engagement: {request.voice_engagement}%")

    print("\n--- NLP ANALYSIS ---")
    print(f"Quality: {quality_result}")
    print(f"Relevance: {relevance_result}")
    print(f"Emotion: {emotion_result}")

    # --- Phase 3: Adaptive decision (EXPERIMENT: Baseline Mode Bypass) ---
    if request.is_baseline:
        # BASELINE: No adaptation. Always follow-up, no difficulty change.
        action = "ASK_FOLLOW_UP"
        shift = "same"
        reason = "Baseline mode: Standard follow-up."
        print("\n--- ADAPTIVE DECISION (BASELINE) ---")
        print(f"Action: {action}")
        print(f"Reason: {reason}")
        adaptive_instruction = "\nIMPORTANT: Ask a relevant follow-up question. Do not change difficulty."
    else:
        # ADAPTIVE: Your actual intelligence (Phase 3 logic)
        decision = adaptive_manager.decide_action({
            "quality": quality_result,
            "relevance": relevance_result,
            "emotion": emotion_result,
        })

        action = decision.get("action", "ASK_FOLLOW_UP")
        shift = decision.get("difficulty_shift", "same")
        reason = decision.get("reason", "Default follow-up.")

        print("\n--- ADAPTIVE DECISION ---")
        print(f"Action: {action}")
        print(f"Difficulty Shift: {shift}")
        print(f"Reason: {reason}")

        # Build adaptive instruction
        if action == "ASK_EASIER":
            adaptive_instruction = "\nIMPORTANT: The user is struggling. Ask a SIMPLER follow-up question. Be supportive."
        elif action == "ASK_HARDER":
            adaptive_instruction = "\nIMPORTANT: The user is doing great. Ask a MORE CHALLENGING follow-up question."
        elif action == "ENCOURAGE":
            adaptive_instruction = f"\nIMPORTANT: The user is nervous. Start with encouragement: '{decision.get('encouragement', 'You are doing well!')}'"
        elif action == "CLARIFY":
            adaptive_instruction = "\nIMPORTANT: The user was vague. Ask them to clarify or elaborate."
        elif action == "CHANGE_TOPIC":
            adaptive_instruction = f"\nIMPORTANT: Change the topic to a different area of {request.role} knowledge."
        else:
            adaptive_instruction = "\nIMPORTANT: Ask a relevant follow-up question about the user's last answer."

    # --- Build system prompt with adaptation ---
    from scenarios.interview.prompts import SYSTEM_PROMPT_TEMPLATE
    
    base_system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        role=request.role,
        difficulty=request.difficulty
    )
    system_prompt_with_adaptation = base_system_prompt + adaptive_instruction

    # --- Generate AI response ---
    ai_reply = llm_interface.generate_response(
        system_prompt=system_prompt_with_adaptation,
        user_message=request.message,
        history_list=history
    )

    # --- Persist in-memory state (Phase 1 rolling window) ---
    session_manager.add_exchange(request.session_id, request.message, ai_reply)

    # --- Phase 4: keep full-session analysis for later averaging ---
    session_manager.add_analysis(
        request.session_id,
        {
            "quality": quality_score,
            "relevance": relevance_score,
            "confidence": emotion_scores.get("confidence"),
            "stress": emotion_scores.get("stress"),
            "hesitation": emotion_scores.get("hesitation"),
            "engagement": emotion_scores.get("engagement"),
            "action": action,
            "shift": shift,
            "reason": reason,
        },
    )

    return ChatResponse(
        session_id=request.session_id,
        reply=ai_reply,
        action=action,
        reason=reason,
    )


def _average(values):
    clean = [v for v in values if v is not None]
    return round(sum(clean) / len(clean), 3) if clean else None


def _skill_level(avg_quality: Optional[float]) -> str:
    if avg_quality is None:
        return "Unrated"
    pct = avg_quality * 100 if avg_quality <= 1 else avg_quality
    if pct >= 80:
        return "Advanced"
    if pct >= 55:
        return "Intermediate"
    return "Beginner"


@router.post("/end_session", response_model=EndSessionResponse)
def end_session(request: EndSessionRequest):
    meta = session_manager.get_session_meta(request.session_id)
    if meta is None:
        raise HTTPException(status_code=404, detail="Session not found or already ended.")

    analyses = session_manager.get_session_analyses(request.session_id)

    avg_quality = _average([a.get("quality") for a in analyses])
    avg_relevance = _average([a.get("relevance") for a in analyses])
    avg_confidence = _average([a.get("confidence") for a in analyses])
    avg_stress = _average([a.get("stress") for a in analyses])
    avg_engagement = _average([a.get("engagement") for a in analyses])

    session_summary = {
        "session_id": request.session_id,
        "user_id": meta.get("user_id", "P001"),
        "user_name": meta.get("user_name", "Anonymous"),
        "role": meta.get("role", "General"),
        "difficulty": meta.get("difficulty", "Intermediate"),
        "mode": meta.get("mode", "adaptive"),
        "start_time": meta.get("start_time"),
        "end_time": datetime.utcnow().isoformat(),
        "avg_quality": avg_quality,
        "avg_confidence": avg_confidence,
        "avg_stress": avg_stress,
        "avg_engagement": avg_engagement,
        "avg_relevance": avg_relevance,
        "final_skill_level": _skill_level(avg_quality),
        "total_exchanges": meta.get("exchange_count", 0),
    }

    db_manager.save_session(session_summary)

    # Generate report
    report_input = dict(session_summary)
    report_input["analyses"] = analyses
    report_text = generate_report(report_input)

    # Free up in-memory state now that it's persisted
    session_manager.clear_session(request.session_id)

    return EndSessionResponse(
        session_id=request.session_id,
        summary=session_summary,
        report=report_text,
    )