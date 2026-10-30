import { useState, useRef, useCallback } from 'react';

export interface VoiceEmotionScores {
  confidence: number;
  stress: number;
  engagement: number;
  isVoiceDetected: boolean;
  isAnalyzing: boolean;
  volume: number;       // Normalized RMS (0 - 100)
  pitch: number;        // Hz
  speakingRate: number; // Words per second
}

// Clamp helper
const clamp = (val: number, min: number, max: number): number => {
  return Math.min(Math.max(val, min), max);
};

// Autocorrelation-based pitch detector for human speech (80Hz - 450Hz)
const detectPitch = (buffer: Float32Array, sampleRate: number): number => {
  const SIZE = buffer.length;
  let sumSquares = 0;
  for (let i = 0; i < SIZE; i++) {
    sumSquares += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sumSquares / SIZE);
  // If signal is too quiet, no valid pitch
  if (rms < 0.015) return -1;

  // Search period corresponding to 80Hz - 450Hz
  const minPeriod = Math.floor(sampleRate / 450);
  const maxPeriod = Math.floor(sampleRate / 80);

  let bestCorrelation = 0;
  let bestPeriod = -1;

  for (let period = minPeriod; period <= maxPeriod; period++) {
    let correlation = 0;
    for (let i = 0; i < SIZE - period; i++) {
      correlation += buffer[i] * buffer[i + period];
    }
    // Normalize correlation by energy
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = period;
    }
  }

  if (bestPeriod > 0 && bestCorrelation > 0.02) {
    return Math.round(sampleRate / bestPeriod);
  }
  return -1;
};

export const useVoiceEmotion = () => {
  const [scores, setScores] = useState<VoiceEmotionScores>({
    confidence: 0,
    stress: 0,
    engagement: 0,
    isVoiceDetected: false,
    isAnalyzing: false,
    volume: 0,
    pitch: 0,
    speakingRate: 0,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Time-series buffers for feature extraction
  const pitchHistoryRef = useRef<number[]>([]);
  const volumeHistoryRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const transcriptRef = useRef<string>('');
  const pauseCountRef = useRef<number>(0);
  const wasSilentRef = useRef<boolean>(true);
  const silenceStartRef = useRef<number>(0);
  const speechDetectedRef = useRef<boolean>(false);

  // Updates word count from SpeechRecognition transcript in real time
  const updateTranscript = useCallback((newTranscript: string) => {
    transcriptRef.current = newTranscript;
  }, []);

  // Compute Voice Emotion metrics from accumulated acoustic features
  const calculateEmotionMetrics = useCallback((): {
    confidence: number;
    stress: number;
    engagement: number;
  } => {
    const volumes = volumeHistoryRef.current;
    const pitches = pitchHistoryRef.current.filter(p => p > 60 && p < 500);

    if (volumes.length === 0 || !speechDetectedRef.current) {
      return { confidence: 0, stress: 0, engagement: 0 };
    }

    // 1. Average Volume (RMS)
    const avgRms = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;

    // 2. Pitch Mean & Variance (Standard Deviation)
    let pitchStdDev = 0;
    if (pitches.length > 2) {
      const avgPitch = pitches.reduce((sum, p) => sum + p, 0) / pitches.length;
      const variance =
        pitches.reduce((acc, p) => acc + Math.pow(p - avgPitch, 2), 0) / pitches.length;
      pitchStdDev = Math.sqrt(variance);
    }

    // 3. Speaking Rate (Words Per Second)
    const words = transcriptRef.current.trim().split(/\s+/).filter(Boolean).length;
    const durationSeconds = Math.max((Date.now() - startTimeRef.current) / 1000, 0.5);
    const wordsPerSec = durationSeconds > 0.8 ? words / durationSeconds : 0;

    // 4. Pauses count
    const pauses = pauseCountRef.current;

    // --- SCORING HEURISTICS ---

    // A. CONFIDENCE (Rate optimal + Pitch stability + Clear volume)
    // Optimal conversational rate is around 2.2 - 3.2 words/sec
    const rateDiff = Math.abs(wordsPerSec - 2.6);
    const rateConfidence = clamp((1 - rateDiff / 1.8) * 50, 5, 50);
    // Pitch stability: low-to-moderate variance indicates composed, steady speech
    const pitchConfidence = clamp((1 - Math.max(pitchStdDev - 15, 0) / 40) * 30, 0, 30);
    // Confident volume: clear, projected voice
    const volumeConfidence = clamp((avgRms / 0.08) * 20, 0, 20);
    const confidence = Math.round(
      clamp(rateConfidence + pitchConfidence + volumeConfidence, 0, 100)
    );

    // B. STRESS (High pitch variation + Rapid speech + Excessive pauses)
    // High pitch jitter / variance (> 35Hz standard deviation)
    const pitchStress = clamp(((pitchStdDev - 25) / 35) * 50, 0, 50);
    // Fast, rushed speech (> 3.3 words/sec)
    const rateStress = clamp(((wordsPerSec - 2.8) / 1.6) * 30, 0, 30);
    // Frequent hesitation pauses (> 2 pauses per sentence)
    const pauseStress = clamp((pauses / 3) * 20, 0, 20);
    const stress = Math.round(clamp(pitchStress + rateStress + pauseStress, 0, 100));

    // C. ENGAGEMENT (Volume energy + Active speaking cadence)
    // Vocal energy / dynamic volume
    const volumeEngagement = clamp((avgRms / 0.12) * 70, 10, 70);
    // Energetic cadence
    const rateEngagement = clamp((wordsPerSec / 2.5) * 30, 0, 30);
    const engagement = Math.round(clamp(volumeEngagement + rateEngagement, 0, 100));

    return { confidence, stress, engagement };
  }, []);

  // Start real-time audio capture and analysis loop
  const startVoiceAnalysis = useCallback(async () => {
    try {
      // Clean up previous instances if any
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Reset histories
      pitchHistoryRef.current = [];
      volumeHistoryRef.current = [];
      startTimeRef.current = Date.now();
      pauseCountRef.current = 0;
      wasSilentRef.current = true;
      speechDetectedRef.current = false;

      const timeBuffer = new Float32Array(analyser.fftSize);

      let lastMetricsUpdate = Date.now();

      const loop = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getFloatTimeDomainData(timeBuffer);

        // Calculate Root Mean Square (Volume)
        let sumSquares = 0;
        for (let i = 0; i < timeBuffer.length; i++) {
          sumSquares += timeBuffer[i] * timeBuffer[i];
        }
        const rms = Math.sqrt(sumSquares / timeBuffer.length);
        const normalizedVolume = Math.round(clamp(rms * 250, 0, 100));

        // Detect pause vs speaking
        const isCurrentlySilent = rms < 0.015;
        const now = Date.now();

        if (!isCurrentlySilent) {
          speechDetectedRef.current = true;
          volumeHistoryRef.current.push(rms);
          // Keep volume window manageable
          if (volumeHistoryRef.current.length > 200) {
            volumeHistoryRef.current.shift();
          }

          if (wasSilentRef.current) {
            const silenceDuration = now - silenceStartRef.current;
            // Pauses between 300ms and 2000ms count as speech pauses
            if (silenceDuration > 300 && silenceDuration < 2500) {
              pauseCountRef.current += 1;
            }
            wasSilentRef.current = false;
          }

          // Detect Pitch
          const currentPitch = detectPitch(timeBuffer, audioCtx.sampleRate);
          if (currentPitch > 65 && currentPitch < 450) {
            pitchHistoryRef.current.push(currentPitch);
            if (pitchHistoryRef.current.length > 150) {
              pitchHistoryRef.current.shift();
            }
          }
        } else {
          if (!wasSilentRef.current) {
            silenceStartRef.current = now;
            wasSilentRef.current = true;
          }
        }

        // Periodically refresh emotion scores (every 300ms)
        if (now - lastMetricsUpdate > 300) {
          lastMetricsUpdate = now;
          if (speechDetectedRef.current) {
            const calculated = calculateEmotionMetrics();
            const latestPitch =
              pitchHistoryRef.current.length > 0
                ? pitchHistoryRef.current[pitchHistoryRef.current.length - 1]
                : 0;

            const words = transcriptRef.current.trim().split(/\s+/).filter(Boolean).length;
            const dur = Math.max((now - startTimeRef.current) / 1000, 0.5);
            const wps = Math.round((words / dur) * 10) / 10;

            setScores({
              confidence: calculated.confidence,
              stress: calculated.stress,
              engagement: calculated.engagement,
              isVoiceDetected: true,
              isAnalyzing: true,
              volume: normalizedVolume,
              pitch: latestPitch,
              speakingRate: wps,
            });
          } else {
            setScores(prev => ({
              ...prev,
              volume: normalizedVolume,
              isAnalyzing: true,
            }));
          }
        }

        animationFrameRef.current = requestAnimationFrame(loop);
      };

      setScores(prev => ({ ...prev, isAnalyzing: true }));
      animationFrameRef.current = requestAnimationFrame(loop);
    } catch (err) {
      console.warn('Could not initialize Web Audio API for voice analysis:', err);
      setScores(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [calculateEmotionMetrics]);

  // Stop analysis and return final scores
  const stopVoiceAnalysis = useCallback((): {
    voice_confidence: number;
    voice_stress: number;
    voice_engagement: number;
  } => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }

    const final = calculateEmotionMetrics();

    setScores({
      confidence: final.confidence,
      stress: final.stress,
      engagement: final.engagement,
      isVoiceDetected: false,
      isAnalyzing: false,
      volume: 0,
      pitch: 0,
      speakingRate: 0,
    });

    return {
      voice_confidence: final.confidence,
      voice_stress: final.stress,
      voice_engagement: final.engagement,
    };
  }, [calculateEmotionMetrics]);

  return {
    ...scores,
    startVoiceAnalysis,
    stopVoiceAnalysis,
    updateTranscript,
  };
};
