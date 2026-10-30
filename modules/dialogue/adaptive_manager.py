"""
Phase 3 — Adaptive Dialogue Manager

Reads the Phase 2 NLP analysis results (quality, relevance, emotion) and
decides what the interview agent should do next: ease up, push harder,
ask for clarification, change topic, encourage, or just follow up.
"""


class AdaptiveDialogueManager:
    """Turns NLP analysis scores into a concrete next-action decision."""

    def decide_action(self, analysis: dict) -> dict:
        """
        Args:
            analysis: {
                "quality": {"score": int, ...},
                "relevance": {"score": int, "skill_level": str, ...},
                "emotion": {"confidence": int, "stress": int, "hesitation": int, ...}
            }

        Returns:
            {
                "action": str,
                "difficulty_shift": "easier" | "harder" | "same",
                "encouragement": str | None,
                "reason": str,
            }
        """
        stress = analysis["emotion"]["stress"]
        confidence = analysis["emotion"]["confidence"]
        quality = analysis["quality"]["score"]
        relevance = analysis["relevance"]["score"]

        # Priority order, highest priority first
        if stress > 70:
            action = "ASK_EASIER"
            reason = f"Stress is high ({stress}). Easing off to reduce pressure."
        elif confidence < 30:
            action = "ASK_EASIER"
            reason = f"Confidence is low ({confidence}). Giving an easier question to build a win."
        elif quality < 40:
            action = "CLARIFY"
            reason = f"Answer quality is low ({quality}). Asking the user to elaborate."
        elif relevance < 30:
            action = "CHANGE_TOPIC"
            reason = f"Relevance is very low ({relevance}). User seems off-topic; switching subject."
        elif confidence > 70 and quality > 70 and relevance > 60:
            action = "ASK_HARDER"
            reason = (
                f"Confidence ({confidence}), quality ({quality}), and relevance "
                f"({relevance}) are all strong. Raising the difficulty."
            )
        elif stress > 50 and confidence > 60:
            action = "ENCOURAGE"
            reason = f"Stress is elevated ({stress}) but confidence is solid ({confidence}). Reassuring before continuing."
        else:
            action = "ASK_FOLLOW_UP"
            reason = "No strong signal in any direction; continuing at the current pace."

        if action == "ASK_EASIER":
            difficulty_shift = "easier"
        elif action == "ASK_HARDER":
            difficulty_shift = "harder"
        else:
            difficulty_shift = "same"

        encouragement = None
        if action == "ENCOURAGE":
            encouragement = "You clearly know this material — take a breath, you're doing well!"
        elif action == "ASK_EASIER":
            encouragement = "Let's take a step back and build on what you already know."

        return {
            "action": action,
            "difficulty_shift": difficulty_shift,
            "encouragement": encouragement,
            "reason": reason,
        }