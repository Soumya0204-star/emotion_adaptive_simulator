"""
app/frontend/dashboard.py

Phase 4 Progress Dashboard. Rendered as a page inside streamlit_app.py
via `render_dashboard()`.

EXPERIMENT UPDATE: Added CSV export button and Quick Stats comparing
Baseline vs Adaptive sessions.
"""

import streamlit as st
import pandas as pd
import plotly.graph_objects as go

from database.db_manager import DatabaseManager
from modules.reporting.report_generator import generate_report

db_manager = DatabaseManager()


def _to_pct(value):
    if value is None:
        return None
    return round(value * 100, 1) if value <= 1 else round(value, 1)


def render_dashboard():
    st.title("📊 Progress Dashboard")

    sessions = db_manager.get_all_sessions()

    if not sessions:
        st.info("No completed sessions yet. Finish a chat session to see your progress here.")
        return

    df = pd.DataFrame(sessions)
    df["session_number"] = range(1, len(df) + 1)
    for col in ["avg_quality", "avg_confidence", "avg_engagement", "avg_relevance", "avg_stress"]:
        if col in df.columns:
            df[col] = df[col].apply(_to_pct)

    # ------------------------------------------------------------------
    # Summary cards
    # ------------------------------------------------------------------
    total_sessions = len(df)
    avg_conf_overall = round(df["avg_confidence"].mean(), 1) if df["avg_confidence"].notna().any() else None
    avg_qual_overall = round(df["avg_quality"].mean(), 1) if df["avg_quality"].notna().any() else None

    c1, c2, c3 = st.columns(3)
    c1.metric("Total Sessions", total_sessions)
    c2.metric("Average Confidence", f"{avg_conf_overall}%" if avg_conf_overall is not None else "N/A")
    c3.metric("Average Quality", f"{avg_qual_overall}%" if avg_qual_overall is not None else "N/A")

    st.divider()

    # ------------------------------------------------------------------
    # EXPERIMENT: Quick Stats Comparison (Baseline vs Adaptive)
    # ------------------------------------------------------------------
    if "mode" in df.columns:
        st.subheader("🔬 Experiment: Baseline vs Adaptive")

        baseline_df = df[df["mode"] == "baseline"]
        adaptive_df = df[df["mode"] == "adaptive"]

        col1, col2, col3, col4 = st.columns(4)

        with col1:
            baseline_conf = baseline_df["avg_confidence"].mean() if not baseline_df.empty else None
            adaptive_conf = adaptive_df["avg_confidence"].mean() if not adaptive_df.empty else None
            st.metric(
                "Avg Confidence",
                f"{adaptive_conf:.1f}%" if adaptive_conf is not None else "N/A",
                delta=f"{adaptive_conf - baseline_conf:.1f}%" if (baseline_conf is not None and adaptive_conf is not None) else None,
                delta_color="normal"
            )

        with col2:
            baseline_qual = baseline_df["avg_quality"].mean() if not baseline_df.empty else None
            adaptive_qual = adaptive_df["avg_quality"].mean() if not adaptive_df.empty else None
            st.metric(
                "Avg Quality",
                f"{adaptive_qual:.1f}%" if adaptive_qual is not None else "N/A",
                delta=f"{adaptive_qual - baseline_qual:.1f}%" if (baseline_qual is not None and adaptive_qual is not None) else None,
                delta_color="normal"
            )

        with col3:
            baseline_eng = baseline_df["avg_engagement"].mean() if not baseline_df.empty else None
            adaptive_eng = adaptive_df["avg_engagement"].mean() if not adaptive_df.empty else None
            st.metric(
                "Avg Engagement",
                f"{adaptive_eng:.1f}%" if adaptive_eng is not None else "N/A",
                delta=f"{adaptive_eng - baseline_eng:.1f}%" if (baseline_eng is not None and adaptive_eng is not None) else None,
                delta_color="normal"
            )

        with col4:
            baseline_exch = baseline_df["total_exchanges"].mean() if not baseline_df.empty else None
            adaptive_exch = adaptive_df["total_exchanges"].mean() if not adaptive_df.empty else None
            st.metric(
                "Avg Exchanges",
                f"{adaptive_exch:.1f}" if adaptive_exch is not None else "N/A",
                delta=f"{adaptive_exch - baseline_exch:.1f}" if (baseline_exch is not None and adaptive_exch is not None) else None,
                delta_color="normal"
            )

        st.caption("📌 Positive delta means Adaptive outperformed Baseline. Negative means Baseline performed better.")

        # Show counts
        st.caption(f"📊 Baseline Sessions: {len(baseline_df)} | Adaptive Sessions: {len(adaptive_df)}")

        st.divider()

    # ------------------------------------------------------------------
    # Progress chart across sessions
    # ------------------------------------------------------------------
    st.subheader("Progress Over Time")

    fig = go.Figure()
    for column, label in [
        ("avg_confidence", "Confidence"),
        ("avg_quality", "Quality"),
        ("avg_engagement", "Engagement"),
    ]:
        if column in df.columns:
            fig.add_trace(
                go.Scatter(
                    x=df["session_number"],
                    y=df[column],
                    mode="lines+markers",
                    name=label,
                )
            )

    fig.update_layout(
        xaxis_title="Session",
        yaxis_title="Score (%)",
        yaxis_range=[0, 100],
        legend_title="Metric",
        height=420,
    )
    st.plotly_chart(fig, use_container_width=True)

    st.divider()

    # ------------------------------------------------------------------
    # EXPERIMENT: CSV Export
    # ------------------------------------------------------------------
    st.subheader("📥 Export Data for Thesis")
    
    csv = df.to_csv(index=False)
    st.download_button(
        label="📊 Download All Sessions as CSV",
        data=csv,
        file_name="experiment_data.csv",
        mime="text/csv",
    )

    st.divider()

    # ------------------------------------------------------------------
    # Session selector + detail breakdown
    # ------------------------------------------------------------------
    st.subheader("Session Detail")

    options = {
        f"Session {row.session_number} — {row.role or 'N/A'} ({row.session_id[:8]})": row.session_id
        for row in df.itertuples()
    }
    selected_label = st.selectbox("Select a past session", list(options.keys())[::-1])
    selected_id = options[selected_label]

    session_row = db_manager.get_session_by_id(selected_id)

    if session_row:
        d1, d2, d3, d4, d5 = st.columns(5)
        d1.metric("Quality", f"{_to_pct(session_row['avg_quality'])}%" if session_row["avg_quality"] is not None else "N/A")
        d2.metric("Relevance", f"{_to_pct(session_row['avg_relevance'])}%" if session_row["avg_relevance"] is not None else "N/A")
        d3.metric("Confidence", f"{_to_pct(session_row['avg_confidence'])}%" if session_row["avg_confidence"] is not None else "N/A")
        d4.metric("Stress", f"{_to_pct(session_row['avg_stress'])}%" if session_row["avg_stress"] is not None else "N/A")
        d5.metric("Engagement", f"{_to_pct(session_row['avg_engagement'])}%" if session_row["avg_engagement"] is not None else "N/A")

        scores = {
            "Quality": session_row["avg_quality"],
            "Relevance": session_row["avg_relevance"],
            "Confidence": session_row["avg_confidence"],
            "Engagement": session_row["avg_engagement"],
        }
        valid_scores = {k: v for k, v in scores.items() if v is not None}
        if valid_scores:
            strength = max(valid_scores, key=valid_scores.get)
            weakness = min(valid_scores, key=valid_scores.get)
            st.markdown(f"**Strength:** {strength}  \n**Needs Improvement:** {weakness}")

        st.divider()

        # ------------------------------------------------------------
        # Report export
        # ------------------------------------------------------------
        st.subheader("Session Report")
        report_text = generate_report(session_row)
        st.code(report_text, language=None)

        st.download_button(
            label="⬇️ Download Report (.txt)",
            data=report_text,
            file_name=f"session_{selected_id[:8]}_report.txt",
            mime="text/plain",
        )