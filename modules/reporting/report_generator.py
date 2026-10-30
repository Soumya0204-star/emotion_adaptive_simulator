"""
modules/reporting/report_generator.py

Builds the human-readable "INTERACTION REPORT" shown at the end of a
session, in both the chat UI and as a downloadable .txt file.

Phase 4: Wrapped in a ReportGenerator class for consistency with other modules.
"""

from typing import Dict, Any, List, Optional


class ReportGenerator:
    """
    Generates formatted session reports from conversation data.
    
    Features:
    - Percentage formatting for scores
    - Main strength/weakness identification
    - Stress pattern detection over the session
    - Pretty ASCII report output
    """
    
    def __init__(self):
        """Initialize the report generator with default settings."""
        self._label_map_strength = {
            "avg_quality": "Technical understanding",
            "avg_relevance": "Answer relevance",
            "avg_confidence": "Confidence under pressure",
            "avg_engagement": "Engagement",
            "avg_communication": "Communication",
        }
        
        self._label_map_weakness = {
            "avg_quality": "Technical depth",
            "avg_relevance": "Staying on-topic",
            "avg_confidence": "Communication confidence",
            "avg_engagement": "Engagement",
            "avg_communication": "Communication clarity",
        }
    
    def _pct(self, value: Optional[float]) -> str:
        """
        Format a 0-1 or 0-100 score as a whole-number percentage string.
        
        Args:
            value: Score to format (0-1 or 0-100 scale)
            
        Returns:
            Formatted percentage string or "N/A"
        """
        if value is None:
            return "N/A"
        v = value * 100 if value <= 1 else value
        return f"{round(v)}%"
    
    def _main_strength(self, scores: Dict[str, Optional[float]]) -> str:
        """
        Identify the user's strongest area based on scores.
        
        Args:
            scores: Dictionary of score averages
            
        Returns:
            Name of the strongest area
        """
        # Filter out None values
        valid_scores = {k: v for k, v in scores.items() if v is not None}
        if not valid_scores:
            return "No data available"
        
        best_key = max(valid_scores, key=lambda k: valid_scores[k])
        return self._label_map_strength.get(best_key, best_key)
    
    def _needs_improvement(self, scores: Dict[str, Optional[float]]) -> str:
        """
        Identify the user's weakest area based on scores.
        
        Args:
            scores: Dictionary of score averages
            
        Returns:
            Name of the weakest area
        """
        # Filter out None values
        valid_scores = {k: v for k, v in scores.items() if v is not None}
        if not valid_scores:
            return "No data available"
        
        worst_key = min(valid_scores, key=lambda k: valid_scores[k])
        return self._label_map_weakness.get(worst_key, worst_key)
    
    def _observed_pattern(self, analyses: List[Dict[str, Any]]) -> str:
        """
        Detect stress patterns during the session.
        
        Compares average stress during technical/harder questions vs. easier
        questions to identify if stress increases with difficulty.
        
        Args:
            analyses: List of per-exchange analysis dicts
            
        Returns:
            Human-readable pattern description
        """
        if not analyses:
            return "Not enough data to detect a pattern."
        
        technical_actions = {"ASK_HARDER", "ASK_FOLLOW_UP"}
        
        technical_stress = [
            a.get("stress", 0)
            for a in analyses
            if a.get("action") in technical_actions and a.get("stress") is not None
        ]
        other_stress = [
            a.get("stress", 0)
            for a in analyses
            if a.get("action") not in technical_actions and a.get("stress") is not None
        ]
        
        # If we have both sets of data, compare them
        if technical_stress and other_stress:
            avg_tech = sum(technical_stress) / len(technical_stress)
            avg_other = sum(other_stress) / len(other_stress)
            if avg_tech > avg_other * 1.15:
                return "Stress increased during technical questions."
            elif avg_other > avg_tech * 1.15:
                return "Stress eased during technical questions."
        
        # If we only have one type of data
        if technical_stress:
            avg_tech = sum(technical_stress) / len(technical_stress)
            if avg_tech > 60:
                return "Moderate stress during technical questions."
            else:
                return "Low stress during technical questions."
        
        return "Stress stayed relatively stable throughout."
    
    def generate(self, session_summary: Dict[str, Any]) -> str:
        """
        Generate a formatted session report.
        
        Args:
            session_summary: Dict containing:
                - session_id: str
                - role: str
                - difficulty: str
                - total_exchanges: int
                - avg_quality: float
                - avg_relevance: float
                - avg_confidence: float
                - avg_engagement: float
                - analyses: Optional[List[Dict]] for pattern detection
                
        Returns:
            Formatted plain-text report
        """
        # Extract basic session info
        session_id = session_summary.get("session_id", "unknown")
        role = session_summary.get("role", "N/A")
        difficulty = session_summary.get("difficulty", "N/A")
        total_exchanges = session_summary.get("total_exchanges", 0)
        
        # Build scores dict
        scores = {
            "avg_quality": session_summary.get("avg_quality"),
            "avg_relevance": session_summary.get("avg_relevance"),
            "avg_confidence": session_summary.get("avg_confidence"),
            "avg_engagement": session_summary.get("avg_engagement"),
        }
        
        # Derive "Communication" as average of confidence + engagement
        # (since your NLP module doesn't return a separate communication score)
        comm_components = [
            v for v in (scores["avg_confidence"], scores["avg_engagement"]) 
            if v is not None
        ]
        avg_communication = (
            sum(comm_components) / len(comm_components) if comm_components else None
        )
        scores["avg_communication"] = avg_communication
        
        # Get strengths, weaknesses, and patterns
        strength = self._main_strength(scores)
        weakness = self._needs_improvement(scores)
        pattern = self._observed_pattern(session_summary.get("analyses", []))
        
        # Build the report
        report = f"""━━━━━━━━━━━━━━━━━━━━━━
INTERACTION REPORT
━━━━━━━━━━━━━━━━━━━━━━
Session ID: {session_id}
Role: {role}
Difficulty: {difficulty}
Exchanges: {total_exchanges}
━━━━━━━━━━━━━━━━━━━━━━

Technical Knowledge   {self._pct(scores['avg_quality'])}
Communication         {self._pct(scores['avg_communication'])}
Confidence            {self._pct(scores['avg_confidence'])}
Answer Relevance      {self._pct(scores['avg_relevance'])}
Engagement            {self._pct(scores['avg_engagement'])}

━━━━━━━━━━━━━━━━━━━━━━
Main Strength:
{strength}

Needs Improvement:
{weakness}

Observed Pattern:
{pattern}
━━━━━━━━━━━━━━━━━━━━━━"""
        
        return report


# --- Backward Compatibility ---
# Keep the function version so existing imports still work

def generate_report(session_summary: Dict[str, Any]) -> str:
    """
    Legacy function version of the report generator.
    Delegates to the class-based implementation.
    
    Args:
        session_summary: Same as ReportGenerator.generate()
        
    Returns:
        Formatted report string
    """
    generator = ReportGenerator()
    return generator.generate(session_summary)