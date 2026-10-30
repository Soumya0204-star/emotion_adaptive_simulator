import re


class AnswerQualityScorer:
    """
    Heuristic-based scorer for interview answer quality.
    No ML yet -- pure rule-based scoring based on word count,
    technical keyword density, and sentence structure.
    """

    TECHNICAL_KEYWORDS = [
        "algorithm", "model", "data", "code", "function", "system",
        "design", "architecture", "performance", "optimization",
        "database", "api", "cloud", "testing", "deployment",
    ]

    def _completeness_score(self, word_count: int) -> float:
        """
        Piecewise-linear interpolation over the anchor points:
        0 words = 0, 10 words = 40, 30 words = 70, 50+ words = 100
        """
        anchors = [(0, 0), (10, 40), (30, 70), (50, 100)]

        if word_count >= anchors[-1][0]:
            return 100.0

        for (x0, y0), (x1, y1) in zip(anchors, anchors[1:]):
            if x0 <= word_count <= x1:
                if x1 == x0:
                    return float(y1)
                fraction = (word_count - x0) / (x1 - x0)
                return y0 + fraction * (y1 - y0)

        return 0.0

    def _relevance_score(self, keyword_count: int) -> float:
        if keyword_count == 0:
            return 20.0
        elif keyword_count <= 2:
            return 50.0
        elif keyword_count <= 4:
            return 75.0
        else:
            return 100.0

    def _structure_score(self, sentence_count: int) -> float:
        if sentence_count <= 1:
            return 30.0
        elif sentence_count <= 3:
            return 60.0
        else:
            return 100.0

    def _feedback(self, score: int) -> str:
        if score > 80:
            return "Excellent, well-structured answer."
        elif score >= 60:
            return "Good answer, consider adding more technical depth."
        elif score >= 40:
            return "Average response. Try to elaborate with specific details."
        else:
            return "Brief answer. Provide more context and technical terms."

    def score_answer(self, user_message: str) -> dict:
        message = user_message or ""

        # Word count
        words = message.split()
        word_count = len(words)

        # Technical keyword count (case-insensitive)
        lower_message = message.lower()
        keyword_count = sum(
            1 for kw in self.TECHNICAL_KEYWORDS if kw in lower_message
        )

        # Sentence count (split by ., !, ?)
        sentences = [s for s in re.split(r"[.!?]", message) if s.strip()]
        sentence_count = len(sentences)

        completeness = self._completeness_score(word_count)
        relevance = self._relevance_score(keyword_count)
        structure = self._structure_score(sentence_count)

        overall_score = round((completeness + relevance + structure) / 3)

        return {
            "score": overall_score,
            "completeness": round(completeness),
            "relevance": round(relevance),
            "feedback": self._feedback(overall_score),
        }