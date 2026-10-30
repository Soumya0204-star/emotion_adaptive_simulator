import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Mic, MicOff, Camera, CameraOff, Activity } from 'lucide-react';
import { useVoiceEmotion } from '@/hooks/useVoiceEmotion';

interface ChatInputProps {
  onSend: (
    message: string,
    multimodalMetrics?: {
      face_confidence?: number;
      face_stress?: number;
      face_engagement?: number;
      voice_confidence?: number;
      voice_stress?: number;
      voice_engagement?: number;
    }
  ) => void;
  disabled?: boolean;
  isCameraOn?: boolean;
  onToggleCamera?: () => void;
  currentFaceMetrics?: {
    confidence: number;
    stress: number;
    engagement: number;
    isFaceDetected: boolean;
  };
}

// Fallback types for native Web Speech API in TypeScript
interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal?: boolean;
    };
    length: number;
  };
  resultIndex: number;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled,
  isCameraOn = false,
  onToggleCamera,
  currentFaceMetrics,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  // Real-time Voice Emotion Hook
  const {
    confidence: voiceConfidence,
    stress: voiceStress,
    engagement: voiceEngagement,
    isVoiceDetected,
    pitch: voicePitch,
    speakingRate: voiceSpeakingRate,
    startVoiceAnalysis,
    stopVoiceAnalysis,
    updateTranscript: updateVoiceTranscript,
  } = useVoiceEmotion();

  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseTextRef = useRef<string>('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech Recognition on mount if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        const prefix = baseTextRef.current ? `${baseTextRef.current.trim()} ` : '';
        const fullTranscript = prefix + currentTranscript;
        setText(fullTranscript);

        // Update real-time word metrics for voice emotion speaking rate calculation
        updateVoiceTranscript(fullTranscript);

        // Reset silence timer on speech detection
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Auto-pause listener after 2 seconds of silence to prevent hot mic
        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch {
              // ignore
            }
          }
        }, 2000);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          alert('Microphone permission denied. Please allow microphone access in your browser settings to use voice input.');
        } else if (event.error === 'audio-capture') {
          alert('No microphone detected. Please connect a microphone and try again.');
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    stopVoiceAnalysis();
    setIsRecording(false);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  }, [stopVoiceAnalysis]);

  const toggleRecording = () => {
    if (!isSupported) {
      alert('Voice input not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      if (disabled) return;
      baseTextRef.current = text;
      try {
        startVoiceAnalysis();
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Could not start recognition:', err);
      }
    }
  };

  const handleSend = () => {
    let finalVoice = { voice_confidence: 0, voice_stress: 0, voice_engagement: 0 };
    if (isRecording) {
      finalVoice = stopVoiceAnalysis();
      stopRecording();
    }
    if (!text.trim() || disabled) return;

    // Build multimodal payload fusing Face and Voice signals
    const multimodalPayload: {
      face_confidence?: number;
      face_stress?: number;
      face_engagement?: number;
      voice_confidence?: number;
      voice_stress?: number;
      voice_engagement?: number;
    } = {};

    // Face signals
    if (isCameraOn && currentFaceMetrics?.isFaceDetected) {
      multimodalPayload.face_confidence = currentFaceMetrics.confidence;
      multimodalPayload.face_stress = currentFaceMetrics.stress;
      multimodalPayload.face_engagement = currentFaceMetrics.engagement;
    }

    // Voice signals
    const vConf = finalVoice.voice_confidence || voiceConfidence;
    const vStress = finalVoice.voice_stress || voiceStress;
    const vEng = finalVoice.voice_engagement || voiceEngagement;

    if (vConf > 0 || vStress > 0 || vEng > 0) {
      multimodalPayload.voice_confidence = vConf;
      multimodalPayload.voice_stress = vStress;
      multimodalPayload.voice_engagement = vEng;
    }

    onSend(text.trim(), Object.keys(multimodalPayload).length > 0 ? multimodalPayload : undefined);
    setText('');
    baseTextRef.current = '';
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t bg-card/60 backdrop-blur-md">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {/* Visual Listening State & Live Voice Emotion Feedback */}
        {isRecording && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium px-1">
            <div className="flex items-center gap-2 text-red-500 dark:text-red-400 animate-pulse">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              Listening & analyzing voice tone... (click mic or press Enter when done)
            </div>

            {/* Real-time Voice Emotion Telemetry */}
            {isVoiceDetected && (
              <div className="flex items-center gap-2 text-[11px] font-mono bg-muted/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-border shadow-sm animate-in fade-in">
                <Activity className="h-3 w-3 text-primary animate-pulse" />
                <span className="text-blue-400 font-semibold">Voice Conf: {voiceConfidence}%</span>
                <span className="text-rose-400 font-semibold">Stress: {voiceStress}%</span>
                <span className="text-emerald-400 font-semibold">Eng: {voiceEngagement}%</span>
                <span className="text-muted-foreground text-[10px] hidden sm:inline">
                  ({voicePitch}Hz · {voiceSpeakingRate}wps)
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Webcam Facial Emotion Tracker Toggle Button */}
          {onToggleCamera && (
            <Button
              type="button"
              variant={isCameraOn ? 'default' : 'outline'}
              size="icon"
              onClick={onToggleCamera}
              disabled={disabled}
              title={
                isCameraOn
                  ? 'Facial Emotion Tracker Active (Click to turn off camera)'
                  : 'Enable Webcam Facial Emotion Tracker (Confidence, Stress, Engagement)'
              }
              className={`shrink-0 h-11 w-11 rounded-xl transition-all ${
                isCameraOn
                  ? 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20'
                  : 'hover:bg-accent text-muted-foreground hover:text-foreground'
              }`}
            >
              {isCameraOn ? (
                <Camera className="h-5 w-5 text-white animate-pulse" />
              ) : (
                <CameraOff className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* Microphone Button */}
          <Button
            type="button"
            variant={isRecording ? 'destructive' : 'outline'}
            size="icon"
            onClick={toggleRecording}
            disabled={disabled || !isSupported}
            title={
              !isSupported
                ? 'Voice input not supported in this browser.'
                : isRecording
                ? 'Stop listening'
                : 'Click to speak (Voice input)'
            }
            className={`shrink-0 h-11 w-11 rounded-xl transition-all ${
              isRecording
                ? 'animate-pulse ring-2 ring-destructive shadow-lg shadow-destructive/30'
                : 'hover:bg-accent'
            } ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRecording ? (
              <MicOff className="h-5 w-5 text-destructive-foreground" />
            ) : (
              <Mic className={`h-5 w-5 ${isSupported ? 'text-primary' : 'text-muted-foreground'}`} />
            )}
          </Button>

          {/* Text Input */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={
                disabled
                  ? 'Session has ended. Start a new session from the sidebar to continue.'
                  : isRecording
                  ? 'Listening to your voice... Speak now...'
                  : 'Type your answer or click the mic to speak... (Press Enter to send)'
              }
              className={`w-full h-11 px-4 pr-12 rounded-xl border bg-background/80 backdrop-blur-sm text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isRecording ? 'border-red-400 ring-1 ring-red-400' : 'border-input'
              }`}
            />

            {/* Quick Send Button */}
            <Button
              type="button"
              size="icon"
              variant="default"
              onClick={handleSend}
              disabled={disabled || !text.trim()}
              title="Send response"
              className="absolute right-1.5 top-1.5 h-8 w-8 rounded-lg shadow-sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
