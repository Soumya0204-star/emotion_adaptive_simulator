import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ChatRequest {
  session_id: string;
  message: string;
  role?: string;
  difficulty?: string;
  user_name?: string;
  user_id?: string;
  is_baseline: boolean;
  // Vision-based emotion scores from webcam face tracking (0-100)
  face_confidence?: number;
  face_stress?: number;
  face_engagement?: number;
  // Voice-based emotion scores from Web Audio API analysis (0-100)
  voice_confidence?: number;
  voice_stress?: number;
  voice_engagement?: number;
}

export interface ChatResponse {
  session_id: string;
  reply: string;
  action: string;
  reason: string;
}

export interface EndSessionRequest {
  session_id: string;
}

export interface SessionSummary {
  session_id: string;
  user_id: string;
  user_name: string;
  role: string;
  difficulty: string;
  mode: 'baseline' | 'adaptive';
  start_time: string;
  end_time: string;
  avg_quality: number | null;
  avg_confidence: number | null;
  avg_stress: number | null;
  avg_engagement: number | null;
  avg_relevance: number | null;
  final_skill_level: string;
  total_exchanges: number;
}

export interface EndSessionResponse {
  session_id: string;
  summary: SessionSummary;
  report: string;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 120 seconds to accommodate remote LLM inference (e.g. NVIDIA NIM)
});

export const apiService = {
  /**
   * Send user message to the adaptive interviewer backend
   */
  async sendMessage(payload: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/chat', payload);
    return response.data;
  },

  /**
   * Finalize the interaction session, trigger report generation and database persistence
   */
  async endSession(sessionId: string): Promise<EndSessionResponse> {
    const response = await apiClient.post<EndSessionResponse>('/end_session', {
      session_id: sessionId,
    });
    return response.data;
  },

  /**
   * Check backend health status
   */
  async checkHealth(): Promise<{ status: string; message: string }> {
    const response = await apiClient.get<{ status: string; message: string }>('/');
    return response.data;
  }
};
