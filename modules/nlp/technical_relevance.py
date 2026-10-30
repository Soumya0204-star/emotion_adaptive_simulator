class TechnicalRelevanceDetector:
    """
    Detects role-specific technical keywords in a candidate's answer
    and estimates a skill level based on keyword coverage.
    """

    ROLE_KEYWORDS = {
        "Data Scientist": [
            "python", "sql", "statistics", "machine learning", "data",
            "model", "analysis", "pandas", "sklearn", "visualization",
            "deep learning", "nlp", "regression", "classification",
        ],
        "Software Engineer": [
            "python", "java", "c++", "algorithms", "data structures",
            "system design", "api", "database", "git", "docker",
            "kubernetes", "microservices", "testing", "debugging",
        ],
        "Data Analyst": [
            "sql", "excel", "dashboard", "visualization", "tableau",
            "power bi", "data cleaning", "reporting", "analytics",
            "business intelligence",
        ],
        "ML Engineer": [
            "python", "tensorflow", "pytorch", "mlops", "deployment",
            "model", "training", "inference", "aws", "azure",
            "docker", "kubernetes", "data pipeline",
        ],
    }

    def _skill_level(self, score: float) -> str:
        if score < 40:
            return "Beginner"
        elif score < 70:
            return "Intermediate"
        else:
            return "Advanced"

    def detect(self, user_message: str, role: str) -> dict:
        message = user_message or ""
        lower_message = message.lower()

        keywords = self.ROLE_KEYWORDS.get(role, [])
        total_keywords = len(keywords)

        keywords_found = [kw for kw in keywords if kw in lower_message]
        found_count = len(keywords_found)

        if total_keywords > 0:
            score = min(100, (found_count / total_keywords) * 100 * 1.5)
        else:
            score = 0

        missing_keywords = [kw for kw in keywords if kw not in lower_message][:3]

        return {
            "keywords_found": keywords_found,
            "score": round(score),
            "skill_level": self._skill_level(score),
            "missing_keywords": missing_keywords,
        }