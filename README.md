# 🧠 Emotion-Aware Adaptive Human Interaction Simulator

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA%20NIM-Llama%203.2-76B900?style=flat-square&logo=nvidia&logoColor=white)](https://build.nvidia.com)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Face%20Mesh-007FFF?style=flat-square&logo=google&logoColor=white)](https://developers.google.com/mediapipe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

> **A real-time, multimodal affective computing platform that estimates candidate emotional states (visual, vocal, and textual) to dynamically calibrate interview dialogue, question difficulty, and empathetic coaching strategies.**

---

## 🌟 Key Highlights

- **👁️ Computer Vision Affective Tracking**: Real-time facial expression, gaze focus, head orientation, and stress/confidence estimation powered by client-side **MediaPipe Face Mesh**.
- **🎙️ Web Audio Acoustics Analysis**: Microphone-driven acoustic feature extraction tracking speech pace (WPM), hesitation/pause frequency, volume dynamics, and pitch stability.
- **📝 NLP Answer Quality & Technical Relevance**: Evaluates semantic completeness, technical keyword coverage, and sentiment for roles like **Data Scientist**, **Software Engineer**, and **Cloud Architect**.
- **🧠 Dynamic Adaptive Dialogue Manager**: Rule-based & LLM-driven adaptation engine adjusting difficulty (`ASK_EASIER`, `ASK_HARDER`, `CLARIFY`, `ENCOURAGE`, `CHANGE_TOPIC`) based on affective fusion.
- **⚡ NVIDIA NIM LLM Integration**: Generates contextual interview questions using high-throughput inference (`meta/llama-3.2-11b-vision-instruct`).
- **🔬 A/B Experimentation Engine**: Built-in **Baseline Mode (Control Group)** vs. **Adaptive Mode (Experimental Group)** with session data persistence and 14-column CSV export for empirical thesis research.
- **🎨 Glassmorphic Cyber-Slate Dashboard**: Ultra-responsive dark/light UI with interactive radar charts, historical trend tracking, and post-session diagnostic reports.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client [Client-Side Multimodal Capture (React + Vite)]
        Webcam[Webcam Video Feed] --> FaceMesh[MediaPipe Face Mesh<br/>Confidence, Stress, Engagement]
        Mic[Microphone Input] --> AudioAPI[Web Audio API<br/>Acoustic Pitch, Pauses, WPM]
        Input[Candidate Answer] --> Payload[Multimodal Feature Fusion]
        FaceMesh --> Payload
        AudioAPI --> Payload
    end

    subgraph Backend [FastAPI Backend Engine (:8000)]
        Payload --> Router["POST /chat"]
        Router --> NLP["NLP Analysis Engine<br/>QualityScorer & RelevanceDetector"]
        NLP --> Emotion["TextEmotionAnalyzer & Affect Fusion"]
        Emotion --> Decision["AdaptiveDialogueManager<br/>(Harder / Easier / Encourage / Clarify)"]
        Decision --> PromptGen["System Prompt Adaptation"]
        PromptGen --> NIM["NVIDIA NIM LLM<br/>(Llama 3.2 Vision Instruct)"]
        NIM --> Reply["Interviewer Reply + Action + Reason"]
        Reply --> SessionMgr["SessionManager & SQLite DB"]
    end

    subgraph Analytics [Research & Reporting]
        SessionMgr --> EndSession["POST /end_session"]
        EndSession --> Report["Diagnostic Skill Report"]
        EndSession --> Export["CSV Export (Thesis Dataset)"]
    end

    Reply --> Client
    Report --> Client
```

---

## 🔬 Adaptive Decision Matrix

The simulator continuously balances candidate **competency** and **affective state** to keep the user in the optimal challenge zone (Flow state):

| Condition | Detected State | System Action | Dialogue Adjustment |
| :--- | :--- | :--- | :--- |
| **High Quality + High Confidence** | `score > 75`, `confidence > 70` | `ASK_HARDER` 🔺 | Shifts question difficulty higher to test depth. |
| **Low Quality + High Stress** | `score < 40`, `stress > 65` | `ASK_EASIER` 🔻 | Reduces difficulty to rebuild confidence and ease tension. |
| **High Hesitation / Nervousness** | `hesitation > 60` or `pauses high` | `ENCOURAGE` 🤝 | Opens with warm reassurance before posing question. |
| **Low Completeness / Vague Answer** | `completeness < 35` | `CLARIFY` 🔍 | Asks candidate to elaborate on specific concepts. |
| **Low Relevance to Target Role** | `relevance < 30` | `CHANGE_TOPIC` 🔄 | Smoothly redirects dialogue to core role competencies. |
| **Baseline Mode Active** | Control Group | `ASK_FOLLOW_UP` ⚖️ | Standard follow-up without difficulty calibration. |

---

## 📂 Project Structure

```text
emotion_adaptive_simulator/
├── app/
│   ├── backend/
│   │   ├── api/
│   │   │   └── chat.py             # FastAPI /chat & /end_session endpoints
│   │   └── main.py                 # Application root & CORS middleware
│   └── frontend/                   # Legacy Streamlit alternative
│       ├── dashboard.py            # Streamlit experiment dashboard
│       └── streamlit_app.py        # Streamlit interactive chat
├── database/
│   ├── db_manager.py               # SQLite schema & session persistence
│   └── simulator.db                # Auto-generated SQLite database (gitignored)
├── frontend-react/                 # Primary Web Application (Vite + React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/               # Interactive Chat HUD & MessageBubbles
│   │   │   ├── dashboard/          # Research Analytics & CSV Exporter
│   │   │   ├── layout/             # Sidebar, Header, Theme toggles
│   │   │   ├── ui/                 # Reusable glassmorphic UI primitives
│   │   │   └── vision/             # FaceTracker & MediaPipe overlay
│   │   ├── context/
│   │   │   └── SessionContext.tsx  # Central state management
│   │   ├── services/
│   │   │   └── api.ts              # Axios HTTP client with auto-fallback
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── modules/
│   ├── dialogue/
│   │   ├── adaptive_manager.py     # Rule-based affective decision matrix
│   │   └── llm_interface.py        # NVIDIA NIM / OpenAI API wrapper
│   ├── nlp/
│   │   ├── answer_quality.py       # Completeness & structure scorer
│   │   ├── technical_relevance.py  # Keyword coverage matcher
│   │   └── text_emotion.py         # Sentiment & linguistic cues
│   └── reporting/
│       └── report_generator.py     # Diagnostic evaluation generator
├── scenarios/
│   └── interview/
│       └── prompts.py              # Domain role prompts & rubrics
├── utils/
│   └── session_manager.py          # Rolling memory & in-flight state
├── .env.example                    # Template for environment variables
├── requirements.txt                # Python backend dependencies
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**
- **NVIDIA NIM API Key** (Free from [build.nvidia.com](https://build.nvidia.com))

---

### 1. Clone & Set Up Environment

```bash
git clone https://github.com/Soumya0204-star/emotion_adaptive_simulator.git
cd emotion_adaptive_simulator
```

Copy the example environment file and add your NVIDIA API key:

```bash
cp .env.example .env
```

Edit `.env`:
```ini
NVIDIA_API_KEY=nvapi-your_actual_key_here
NVIDIA_MODEL=meta/llama-3.2-11b-vision-instruct
```

---

### 2. Backend Setup (FastAPI)

Install Python dependencies:
```bash
pip install -r requirements.txt
```

Start the FastAPI server:
```bash
python -m uvicorn app.backend.main:app --reload --port 8000
```
- API Root: `http://127.0.0.1:8000`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup (React + Vite)

Open a new terminal window:
```bash
cd frontend-react
npm install
npm run dev
```

Visit **`http://localhost:3000`** in any modern web browser (Chrome, Edge, or Firefox).

*(Optional)* If you wish to run the legacy Streamlit interface:
```bash
streamlit run app/frontend/streamlit_app.py --server.port 8501
```

---

## 📊 Research & Thesis Experimentation

The simulator includes automated data collection for human-computer interaction studies:

1. **Participant Configuration**: Assign Participant IDs (`P001`, `P002`, etc.) and target roles.
2. **A/B Testing Controls**: Toggle between **Adaptive (Experimental)** and **Baseline (Control)** modes.
3. **Automated Metrics**: Captures average technical quality, confidence, stress, hesitation, engagement, and question shifts.
4. **CSV Export**: One-click export of `experiment_data.csv` directly from the Analytics tab for statistical analysis in Python (Pandas/SciPy/R).

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👤 Author

**Soumya**
- GitHub: [@Soumya0204-star](https://github.com/Soumya0204-star)
- Institution: Vellore Institute of Technology (VIT)
