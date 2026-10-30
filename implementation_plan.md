# Implementation Plan: Emotion-Aware Adaptive Human Interaction Simulator Frontend

Build a state-of-the-art, responsive, dark-mode glassmorphic Web Frontend for the **Emotion-Aware Adaptive Human Interaction Simulator**. The frontend connects strictly to the existing FastAPI backend (`POST /chat` and `POST /end_session` on `http://localhost:8000`) without modifying any backend code, while delivering rich multimodal simulation (Voice STT/Acoustics, Webcam Face/Engagement Tracking, User State Fusion, Dynamic Adaptive Feedback HUD, Experiment Controls, and Research Analytics Dashboard).

---

## User Review Required

> [!IMPORTANT]
> **Strict Backend Isolation**: As requested, the backend code will **NOT** be modified in any way. The frontend communicates with the backend exclusively via the two existing endpoints:
> - `POST /chat` (`{ session_id, message, role, difficulty, user_id, user_name, is_baseline }` -> `{ reply, action, reason }`)
> - `POST /end_session` (`{ session_id }` -> `{ summary, report }`)
> All pending multimodal capabilities (Voice STT, Acoustic Pitch/Pause analysis, Face tracking/Engagement estimation, Multimodal User State fusion, and Experiment Analytics) are implemented purely on the client side in the browser.

> [!NOTE]
> The web application will run on `http://localhost:3000` (which is already pre-configured in the FastAPI backend's CORS `allow_origins` list) and can also be opened directly in any modern browser.

---

## Proposed Architecture & Features

### 1. Technology Stack
- **Core Structure**: Semantic HTML5 with modular layout and accessible attributes.
- **Styling**: Vanilla CSS3 with custom design tokens, modern glassmorphism, responsive grid/flexbox, smooth micro-interactions, and dark cyber-slate palette.
- **Logic & State**: Modern ES6+ JavaScript modules (`app.js`, `api.js`, `audio.js`, `vision.js`, `dashboard.js`, `storage.js`).
- **Data Visualization**: Chart.js / HTML5 Canvas for real-time acoustic waveforms, multimodal state radar, and multi-session trend charts.
- **Browser APIs**:
  - **Web Speech API**: Speech-to-Text (mic input) and SpeechSynthesis (AI interviewer voice output).
  - **Web Audio API**: Real-time microphone acoustic analysis (pitch/frequency detection, volume levels, speaking rate, hesitation/pause detection).
  - **MediaDevices & Canvas API**: Webcam feed with real-time face detection, gaze attention, and engagement tracking.

---

### 2. Key Frontend Views & Components

#### View 1: 🎙️ Live Simulator & Interaction HUD
- **Session Configuration Bar**:
  - Participant ID input (`P001`, `P002`, etc. for thesis experiments).
  - Participant Name.
  - Scenario Selector:
    - 💼 **HR Technical Interview** (Data Scientist, Software Engineer, Cloud Architect)
    - 🤝 **Customer Negotiation** (High-Stakes Client, Contract Dispute)
    - 🩺 **Medical Consultation** (Patient Triage, Empathy Assessment)
    - 🎤 **Public Speaking & Pitching** (VC Pitch, Keynote Rehearsal)
  - Difficulty Selector: `Beginner`, `Intermediate`, `Advanced`.
  - **Experiment Mode Toggle**: 🔒 **Baseline Mode (Control)** vs 🧠 **Adaptive Mode (Experimental)** with live badge indicator.
- **Dynamic Adaptive Decision HUD**:
  - Live AI action badge (`ASK_EASIER`, `ASK_HARDER`, `CLARIFY`, `ENCOURAGE`, `CHANGE_TOPIC`, `ASK_FOLLOW_UP`).
  - Adaptive reasoning breakdown card explaining why the AI adjusted its prompt.
  - Difficulty shift indicator (🔺 Harder, 🔻 Easier, ⚖️ Same).
- **Interactive Conversation Feed**:
  - AI and User message bubbles with timestamps and role badges.
  - AI thinking / typing pulsation animation while waiting for backend response.
  - Spoken reply toggle (Text-to-Speech playback of AI interviewer's replies).
- **Phase 4 Voice HUD (Speech-to-Text + Acoustics)**:
  - Microphone push-to-talk & continuous recording toggle.
  - Real-time animated audio visualizer (oscilloscope/waveform).
  - Acoustic feature telemetry: Speaking Pace (WPM), Pitch Stability, Pause/Hesitation detection.
- **Phase 5 Visual HUD (Webcam & Face Tracking)**:
  - Real-time webcam preview with interactive tracking overlay.
  - Live Engagement meter, Head Pose/Gaze focus, and Facial Expression detector (Neutral, Confident, Stressed).
- **Phase 6 Multimodal Fusion Matrix**:
  - Real-time composite "User State Index" combining Text signals, Voice acoustics, and Visual engagement.
  - Live interactive radar chart displaying multi-axis dimensions (Confidence, Quality, Stress, Hesitation, Engagement).

#### View 2: 🛑 Session Report & Diagnostic Modal
- Triggered by the "End Session" button calling `POST /end_session`.
- Displays comprehensive session analytics:
  - Overall Skill Level achieved (`Beginner`, `Intermediate`, `Advanced`).
  - Metric bars: Technical Quality, Relevance, Confidence, Stress, Engagement.
  - Identified Primary Strength & Needs Improvement areas.
  - Formatted text report display with **Copy to Clipboard** and **Download Report (.txt)**.
  - Persists completed session into local storage for the dashboard.

#### View 3: 📊 Research & Progress Dashboard (Phases 9 & 11-12)
- **Experiment Group Comparison (Baseline vs. Adaptive)**:
  - Side-by-side performance cards with calculated Deltas (Confidence Δ, Quality Δ, Engagement Δ, Avg Exchanges Δ).
  - Participant counts ($N_{baseline}$ vs $N_{adaptive}$).
  - Statistical insights on whether adaptation improved confidence and reduced stress.
- **Progress Over Time**:
  - Multi-line interactive trend chart tracking Confidence, Quality, and Engagement across all completed sessions.
- **Thesis Data Export**:
  - One-click **Download All Sessions as CSV (`experiment_data.csv`)** formatted with all 14 columns required for thesis/paper analysis.
- **Session History Deep-Dive**:
  - Filterable table of past sessions with full summary metrics and report view modal.

---

## Directory & File Structure

We will place the frontend inside `frontend/` at the root with clean separation:

```
c:\Users\asus\Downloads\emotion_adaptive_simulator\
├── emotion_adaptive_simulator/        # Existing backend (UNTOUCHED)
│   ├── app/backend/...
│   ├── database/...
│   └── ...
└── frontend/                          # NEW Web Application Frontend
    ├── index.html                     # Main SPA entrypoint
    ├── css/
    │   ├── style.css                  # Design system tokens & base layout
    │   ├── chat.css                   # Conversation UI & HUD styling
    │   ├── multimodal.css             # Audio/Video canvas & telemetry HUD
    │   └── dashboard.css              # Progress charts & experiment tables
    ├── js/
    │   ├── app.js                     # Main application controller & routing
    │   ├── api.js                     # FastAPI client (chat & end_session calls)
    │   ├── audio.js                   # Web Speech STT + Web Audio acoustic analyzer
    │   ├── vision.js                  # Camera feed & facial engagement tracking
    │   ├── dashboard.js               # Analytics, Chart.js plots, & CSV exporter
    │   └── storage.js                 # Session persistence & experiment metrics
    ├── package.json                   # Dev server script (port 3000)
    └── run_frontend.bat               # Windows batch file for 1-click startup
```

---

## Verification Plan

### Automated & Manual Verification Steps
1. **Dev Server Verification**:
   - Start frontend server on `http://localhost:3000` via `npm run dev` or a local HTTP server.
   - Start backend server on `http://localhost:8000` via `python -m uvicorn app.backend.main:app --port 8000`.
2. **API Endpoint Integration Testing**:
   - Send messages through the frontend and verify HTTP 200 responses from `POST /chat`.
   - Verify that adaptive decision tags (`action` and `reason`) render accurately in the HUD.
   - Verify that toggling Baseline Mode sends `is_baseline: true` and receives standard follow-up behavior.
   - Click "End Session" and verify `POST /end_session` returns summary and report.
3. **Multimodal Features Testing**:
   - Test microphone input with Web Speech Recognition and Web Audio waveform visualizer.
   - Test webcam activation and face engagement tracking canvas.
   - Test text-to-speech audio playback.
4. **Dashboard & Experiment Testing**:
   - Verify session summaries are persisted in local history.
   - Verify Baseline vs. Adaptive delta calculations.
   - Verify CSV export generates valid RFC 4180 CSV with all expected columns.
5. **Browser Visual Inspection**:
   - Use browser subagent to interactively load the frontend, test UI workflows, and verify aesthetic excellence.
