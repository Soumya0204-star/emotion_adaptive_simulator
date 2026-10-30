class TextEmotionAnalyzer:
    """
    Word-based heuristic emotion analyzer for interview answers.
    Counts occurrences of signal-word lists to derive confidence,
    stress, hesitation, engagement, and overall sentiment.
    """

    HESITATION_WORDS = [
        "um", "uh", "like", "maybe", "i think", "not sure",
        "perhaps", "could be", "might",
    ]

    CONFIDENCE_WORDS = [
        "definitely", "certainly", "absolutely", "clearly",
        "without doubt", "sure", "confident", "positive",
    ]

    STRESS_WORDS = [
        "stress", "difficult", "challenging", "overwhelming",
        "tough", "hard", "struggle", "pressure",
    ]

    ENGAGEMENT_WORDS = [
        "interesting", "great", "good", "excellent", "love",
        "enjoy", "fascinating", "amazing", "valuable",
    ]

    POSITIVE_WORDS = ["good", "great", "excellent", "love", "enjoy", "nice"]
    NEGATIVE_WORDS = ["bad", "poor", "terrible", "awful", "worse", "dislike"]

    def _count_occurrences(self, text: str, word_list: list) -> int:
        return sum(text.count(word) for word in word_list)

    def analyze(self, user_message: str) -> dict:
        message = user_message or ""
        lower_message = message.lower()

        hesitation_count = self._count_occurrences(lower_message, self.HESITATION_WORDS)
        confidence_count = self._count_occurrences(lower_message, self.CONFIDENCE_WORDS)
        stress_count = self._count_occurrences(lower_message, self.STRESS_WORDS)
        engagement_count = self._count_occurrences(lower_message, self.ENGAGEMENT_WORDS)
        positive_count = self._count_occurrences(lower_message, self.POSITIVE_WORDS)
        negative_count = self._count_occurrences(lower_message, self.NEGATIVE_WORDS)

        total_signal_words = (
            hesitation_count
            + confidence_count
            + stress_count
            + engagement_count
            + positive_count
            + negative_count
        )

        # Fallback: no signal words found anywhere -> default neutral profile
        if total_signal_words == 0:
            return {
                "confidence": 50,
                "stress": 50,
                "hesitation": 50,
                "engagement": 50,
                "sentiment": "neutral",
            }

        hesitation_score = min(100, hesitation_count * 20)
        confidence_score = min(100, confidence_count * 25)
        stress_score = min(100, stress_count * 20)
        engagement_score = min(100, engagement_count * 20)

        if positive_count > negative_count:
            sentiment = "positive"
        elif negative_count > positive_count:
            sentiment = "negative"
        else:
            sentiment = "neutral"

        return {
            "confidence": confidence_score,
            "stress": stress_score,
            "hesitation": hesitation_score,
            "engagement": engagement_score,
            "sentiment": sentiment,
        }