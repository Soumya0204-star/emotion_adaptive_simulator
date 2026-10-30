import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { apiService, SessionSummary } from '@/services/api';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: string;
  reason?: string;
  timestamp: string;
}

export interface PastSession {
  summary: SessionSummary;
  report: string;
}

export interface SessionContextType {
  sessionId: string;
  participantId: string;
  userName: string;
  role: string;
  difficulty: string;
  isBaseline: boolean;
  messages: Message[];
  isTyping: boolean;
  sessionEnded: boolean;
  currentReport: string | null;
  currentSummary: SessionSummary | null;
  showReportModal: boolean;
  pastSessions: PastSession[];
  theme: 'dark' | 'light';
  backendConnected: boolean;

  setParticipantId: (id: string) => void;
  setUserName: (name: string) => void;
  setRole: (role: string) => void;
  setDifficulty: (difficulty: string) => void;
  setIsBaseline: (isBaseline: boolean) => void;
  setShowReportModal: (show: boolean) => void;
  toggleTheme: () => void;
  
  sendMessage: (
    content: string,
    multimodalMetrics?: {
      face_confidence?: number;
      face_stress?: number;
      face_engagement?: number;
      voice_confidence?: number;
      voice_stress?: number;
      voice_engagement?: number;
    }
  ) => Promise<void>;
  endSession: () => Promise<void>;
  startNewSession: () => void;
  refreshPastSessions: () => void;
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'emotion_adaptive_sessions_v1';
const THEME_STORAGE_KEY = 'emotion_adaptive_theme';

// Seed realistic thesis baseline vs adaptive demo sessions if empty
const INITIAL_DEMO_SESSIONS: PastSession[] = [
  {
    summary: {
      session_id: 'b1a23c4d-9876-4321-a1b2-c3d4e5f6a701',
      user_id: 'P001',
      user_name: 'Alex Rivera',
      role: 'Data Scientist',
      difficulty: 'Intermediate',
      mode: 'baseline',
      start_time: '2026-09-01T10:00:00.000Z',
      end_time: '2026-09-01T10:15:30.000Z',
      avg_quality: 58.4,
      avg_confidence: 48.2,
      avg_stress: 64.0,
      avg_engagement: 52.1,
      avg_relevance: 55.0,
      final_skill_level: 'Intermediate',
      total_exchanges: 6,
    },
    report: `━━━━━━━━━━━━━━━━━━━━━━\nINTERACTION REPORT (BASELINE)\n━━━━━━━━━━━━━━━━━━━━━━\nSession ID: b1a23c4d-9876-4321-a1b2-c3d4e5f6a701\nRole: Data Scientist\nDifficulty: Intermediate\nExchanges: 6\n━━━━━━━━━━━━━━━━━━━━━━\nTechnical Knowledge   58%\nCommunication         50%\nConfidence            48%\nAnswer Relevance      55%\nEngagement            52%\n━━━━━━━━━━━━━━━━━━━━━━\nMain Strength: Answer relevance\nNeeds Improvement: Communication confidence\nObserved Pattern: Stress increased during technical questions without adaptation.`,
  },
  {
    summary: {
      session_id: 'e4f56a7b-1234-5678-b2c3-d4e5f6a7b802',
      user_id: 'P002',
      user_name: 'Samantha Chen',
      role: 'Data Scientist',
      difficulty: 'Intermediate',
      mode: 'adaptive',
      start_time: '2026-09-02T14:30:00.000Z',
      end_time: '2026-09-02T14:48:15.000Z',
      avg_quality: 74.8,
      avg_confidence: 76.5,
      avg_stress: 32.4,
      avg_engagement: 78.0,
      avg_relevance: 72.3,
      final_skill_level: 'Intermediate',
      total_exchanges: 8,
    },
    report: `━━━━━━━━━━━━━━━━━━━━━━\nINTERACTION REPORT (ADAPTIVE)\n━━━━━━━━━━━━━━━━━━━━━━\nSession ID: e4f56a7b-1234-5678-b2c3-d4e5f6a7b802\nRole: Data Scientist\nDifficulty: Intermediate\nExchanges: 8\n━━━━━━━━━━━━━━━━━━━━━━\nTechnical Knowledge   75%\nCommunication         77%\nConfidence            77%\nAnswer Relevance      72%\nEngagement            78%\n━━━━━━━━━━━━━━━━━━━━━━\nMain Strength: Confidence under pressure\nNeeds Improvement: Technical depth\nObserved Pattern: Stress eased after dynamic adaptive reassurance and scaffolding.`,
  },
  {
    summary: {
      session_id: 'c7d89e0f-4321-8765-c3d4-e5f6a7b8c903',
      user_id: 'P003',
      user_name: 'Marcus Vance',
      role: 'Software Engineer',
      difficulty: 'Advanced',
      mode: 'baseline',
      start_time: '2026-09-03T11:10:00.000Z',
      end_time: '2026-09-03T11:24:00.000Z',
      avg_quality: 62.0,
      avg_confidence: 51.0,
      avg_stress: 68.5,
      avg_engagement: 56.0,
      avg_relevance: 60.0,
      final_skill_level: 'Intermediate',
      total_exchanges: 5,
    },
    report: `━━━━━━━━━━━━━━━━━━━━━━\nINTERACTION REPORT (BASELINE)\n━━━━━━━━━━━━━━━━━━━━━━\nSession ID: c7d89e0f-4321-8765-c3d4-e5f6a7b8c903\nRole: Software Engineer\nDifficulty: Advanced\nExchanges: 5\n━━━━━━━━━━━━━━━━━━━━━━\nTechnical Knowledge   62%\nCommunication         54%\nConfidence            51%\nAnswer Relevance      60%\nEngagement            56%\n━━━━━━━━━━━━━━━━━━━━━━\nMain Strength: Technical understanding\nNeeds Improvement: Communication confidence\nObserved Pattern: Stress stayed high throughout session.`,
  },
  {
    summary: {
      session_id: 'f0a12b3c-5678-9012-d4e5-f6a7b8c9d004',
      user_id: 'P004',
      user_name: 'Elena Rostova',
      role: 'Software Engineer',
      difficulty: 'Advanced',
      mode: 'adaptive',
      start_time: '2026-09-04T16:00:00.000Z',
      end_time: '2026-09-04T16:22:45.000Z',
      avg_quality: 83.2,
      avg_confidence: 84.0,
      avg_stress: 28.0,
      avg_engagement: 82.5,
      avg_relevance: 80.0,
      final_skill_level: 'Advanced',
      total_exchanges: 9,
    },
    report: `━━━━━━━━━━━━━━━━━━━━━━\nINTERACTION REPORT (ADAPTIVE)\n━━━━━━━━━━━━━━━━━━━━━━\nSession ID: f0a12b3c-5678-9012-d4e5-f6a7b8c9d004\nRole: Software Engineer\nDifficulty: Advanced\nExchanges: 9\n━━━━━━━━━━━━━━━━━━━━━━\nTechnical Knowledge   83%\nCommunication         83%\nConfidence            84%\nAnswer Relevance      80%\nEngagement            83%\n━━━━━━━━━━━━━━━━━━━━━━\nMain Strength: Technical understanding\nNeeds Improvement: Staying on-topic\nObserved Pattern: Elevated difficulty prompted optimal engagement and high performance.`,
  }
];

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string>(() => uuidv4());
  const [participantId, setParticipantId] = useState<string>('P001');
  const [userName, setUserName] = useState<string>('Candidate');
  const [role, setRole] = useState<string>('Data Scientist');
  const [difficulty, setDifficulty] = useState<string>('Intermediate');
  const [isBaseline, setIsBaseline] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [sessionEnded, setSessionEnded] = useState<boolean>(false);
  const [currentReport, setCurrentReport] = useState<string | null>(null);
  const [currentSummary, setCurrentSummary] = useState<SessionSummary | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [backendConnected, setBackendConnected] = useState<boolean>(true);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  const [pastSessions, setPastSessions] = useState<PastSession[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse past sessions from localStorage', e);
    }
    return INITIAL_DEMO_SESSIONS;
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Save past sessions
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(pastSessions));
    } catch (e) {
      console.error('Failed to save past sessions', e);
    }
  }, [pastSessions]);

  // Check backend health periodically
  useEffect(() => {
    const check = async () => {
      try {
        await apiService.checkHealth();
        setBackendConnected(true);
      } catch (err) {
        setBackendConnected(false);
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const startNewSession = () => {
    const newId = uuidv4();
    setSessionId(newId);
    setMessages([]);
    setSessionEnded(false);
    setCurrentReport(null);
    setCurrentSummary(null);
    setShowReportModal(false);
    setIsTyping(false);
  };

  const refreshPastSessions = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setPastSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async (
    content: string,
    multimodalMetrics?: {
      face_confidence?: number;
      face_stress?: number;
      face_engagement?: number;
      voice_confidence?: number;
      voice_stress?: number;
      voice_engagement?: number;
    }
  ) => {
    if (!content.trim() || sessionEnded || isTyping) return;

    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await apiService.sendMessage({
        session_id: sessionId,
        message: userMsg.content,
        role,
        difficulty,
        user_name: userName,
        user_id: participantId,
        is_baseline: isBaseline,
        face_confidence: multimodalMetrics?.face_confidence,
        face_stress: multimodalMetrics?.face_stress,
        face_engagement: multimodalMetrics?.face_engagement,
        voice_confidence: multimodalMetrics?.voice_confidence,
        voice_stress: multimodalMetrics?.voice_stress,
        voice_engagement: multimodalMetrics?.voice_engagement,
      });

      const assistantMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.reply,
        action: response.action,
        reason: response.reason,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      const errorMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `⚠️ Error contacting backend: ${error.message || 'Make sure the FastAPI server is running on http://localhost:8000'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const endSession = async () => {
    if (sessionEnded) {
      setShowReportModal(true);
      return;
    }

    try {
      const data = await apiService.endSession(sessionId);
      setCurrentSummary(data.summary);
      setCurrentReport(data.report);
      setSessionEnded(true);
      setShowReportModal(true);

      // Add to past sessions list
      const newEntry: PastSession = {
        summary: data.summary,
        report: data.report,
      };

      setPastSessions(prev => {
        const filtered = prev.filter(p => p.summary.session_id !== data.summary.session_id);
        return [newEntry, ...filtered];
      });
    } catch (error: any) {
      console.error('Failed to end session:', error);
      alert(`Could not end session: ${error.message || 'Backend connection error'}`);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        participantId,
        userName,
        role,
        difficulty,
        isBaseline,
        messages,
        isTyping,
        sessionEnded,
        currentReport,
        currentSummary,
        showReportModal,
        pastSessions,
        theme,
        backendConnected,

        setParticipantId,
        setUserName,
        setRole,
        setDifficulty,
        setIsBaseline,
        setShowReportModal,
        toggleTheme,

        sendMessage,
        endSession,
        startNewSession,
        refreshPastSessions,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
