import { useState, useEffect, useRef, useCallback } from 'react';

export interface FaceEmotionScores {
  confidence: number;
  stress: number;
  engagement: number;
  isFaceDetected: boolean;
  isLoading: boolean;
  error: string | null;
}

interface Landmark {
  x: number;
  y: number;
  z: number;
}

// Euclidean distance between two 2D points
const dist2D = (p1: Landmark, p2: Landmark): number => {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
};

// Clamp helper
const clamp = (val: number, min: number, max: number): number => {
  return Math.min(Math.max(val, min), max);
};

export const useFaceEmotion = (enabled: boolean = true) => {
  const [scores, setScores] = useState<FaceEmotionScores>({
    confidence: 0,
    stress: 0,
    engagement: 0,
    isFaceDetected: false,
    isLoading: true,
    error: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<any>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);

  // Tracking previous positions for movement stability
  const prevNoseRef = useRef<{ x: number; y: number } | null>(null);
  const blinkHistoryRef = useRef<number[]>([]);

  // Exponential moving averages for smooth, jitter-free UI metrics
  const smoothedRef = useRef({
    confidence: 50,
    stress: 30,
    engagement: 60,
  });

  // Calculate emotions from 468 MediaPipe FaceMesh landmarks
  const processLandmarks = useCallback((landmarks: Landmark[]) => {
    if (!landmarks || landmarks.length < 468) {
      setScores(prev => ({
        ...prev,
        isFaceDetected: false,
        confidence: 0,
        stress: 0,
        engagement: 0,
      }));
      return;
    }

    // Key Landmark indices
    // 1: Nose tip
    // 33: Left eye outer corner, 133: Left eye inner corner
    // 263: Right eye outer corner, 362: Right eye inner corner
    // 159, 145: Left eye top/bottom lids
    // 386, 374: Right eye top/bottom lids
    // 61, 291: Mouth corners (left, right)
    // 0, 17: Upper and lower outer lip centers
    // 13, 14: Upper and lower inner lip centers
    // 107, 336: Inner eyebrows (left, right)
    // 10: Forehead center, 152: Chin bottom

    const nose = landmarks[1];
    const leftEyeOuter = landmarks[33];
    const rightEyeOuter = landmarks[263];
    const leftEyeInner = landmarks[133];
    const rightEyeInner = landmarks[362];
    const leftEyeTop = landmarks[159];
    const leftEyeBottom = landmarks[145];
    const rightEyeTop = landmarks[386];
    const rightEyeBottom = landmarks[374];
    const mouthLeft = landmarks[61];
    const mouthRight = landmarks[291];
    const lipTop = landmarks[0];
    const lipBottom = landmarks[17];
    const innerLipTop = landmarks[13];
    const innerLipBottom = landmarks[14];
    const browLeft = landmarks[107];
    const browRight = landmarks[336];

    // Reference interocular scale (eye distance)
    const eyeDist = Math.max(dist2D(leftEyeOuter, rightEyeOuter), 0.05);

    // 1. Head Pose (Yaw: Left / Right rotation)
    const distNoseLeft = dist2D(nose, leftEyeOuter);
    const distNoseRight = dist2D(nose, rightEyeOuter);
    const yawDiff = Math.abs(distNoseLeft - distNoseRight) / eyeDist;
    // Looking straight: yawDiff < 0.15 gives full 50 points; drops to 0 at yawDiff > 0.35
    const headPostureScore = clamp((1 - (yawDiff - 0.08) / 0.25) * 50, 0, 50);

    // 2. Eye Aspect Ratio (EAR) & Eye Contact
    const leftEAR = dist2D(leftEyeTop, leftEyeBottom) / Math.max(dist2D(leftEyeOuter, leftEyeInner), 0.01);
    const rightEAR = dist2D(rightEyeTop, rightEyeBottom) / Math.max(dist2D(rightEyeOuter, rightEyeInner), 0.01);
    const avgEAR = (leftEAR + rightEAR) / 2;

    const isBlinking = avgEAR < 0.13;
    const now = Date.now();
    if (isBlinking) {
      blinkHistoryRef.current.push(now);
    }
    // Clean old blinks (> 4 seconds)
    blinkHistoryRef.current = blinkHistoryRef.current.filter(t => now - t < 4000);
    const blinkCountRecent = blinkHistoryRef.current.length;

    // Focused eyes open (+20 for Confidence)
    const eyesFocusedScore = !isBlinking && avgEAR > 0.18 ? 20 : clamp((avgEAR / 0.18) * 20, 0, 20);

    // 3. Smile Detection (Mouth width + corner elevation)
    const mouthWidth = dist2D(mouthLeft, mouthRight);
    const mouthWidthRatio = mouthWidth / eyeDist;
    const lipCornersY = (mouthLeft.y + mouthRight.y) / 2;
    const lipCenterY = (lipTop.y + lipBottom.y) / 2;
    // When smiling, corners are elevated above center (lower y)
    const cornerLift = (lipCenterY - lipCornersY) / eyeDist;
    const smileMetric = (mouthWidthRatio - 0.48) * 40 + cornerLift * 100;
    const smileScore = clamp(smileMetric * 2, 0, 30);

    // TOTAL CONFIDENCE = Upright/straight (+50) + Smile (+30) + Focused eyes (+20)
    const rawConfidence = clamp(headPostureScore + smileScore + eyesFocusedScore, 0, 100);

    // 4. Stress Detection:
    // Brow furrow (inner brows close and pulled down toward eyes)
    const browDist = dist2D(browLeft, browRight) / eyeDist;
    const browEyeDist = ((browLeft.y - leftEyeInner.y) + (browRight.y - rightEyeInner.y)) / 2 / eyeDist;
    // Lower brow-eye distance = furrowed brows
    const browFurrowScore = clamp((0.32 - browDist) * 120 + (0.22 - Math.abs(browEyeDist)) * 80, 0, 50);

    // Lip pressing (tight mouth height)
    const lipHeight = dist2D(innerLipTop, innerLipBottom) / eyeDist;
    const lipPressScore = clamp((0.04 - lipHeight) * 600, 0, 30);

    // Rapid blinking or looking away (+20 to stress)
    const lookingAway = yawDiff > 0.32;
    const rapidBlinking = blinkCountRecent > 4;
    const agitationScore = (lookingAway ? 15 : 0) + (rapidBlinking ? 10 : 0);
    const stressAgitation = clamp(agitationScore, 0, 20);

    // TOTAL STRESS = Furrow (+50) + Lip press (+30) + Agitation/Looking away (+20)
    const rawStress = clamp(browFurrowScore + lipPressScore + stressAgitation, 0, 100);

    // 5. Engagement Detection:
    // Leaning forward (face scale / interocular distance in frame)
    const forwardLeanScore = clamp(((eyeDist - 0.22) / 0.15) * 40, 10, 40);

    // Head stability (minimal lateral movement between frames)
    let stabilityScore = 30;
    if (prevNoseRef.current) {
      const movement = Math.hypot(nose.x - prevNoseRef.current.x, nose.y - prevNoseRef.current.y);
      stabilityScore = clamp((1 - movement / 0.03) * 30, 5, 30);
    }
    prevNoseRef.current = { x: nose.x, y: nose.y };

    // Eyes open (high aspect ratio)
    const eyesOpenScore = clamp((avgEAR / 0.24) * 30, 5, 30);

    // TOTAL ENGAGEMENT = Forward lean (+40) + Stability (+30) + Eyes open (+30)
    const rawEngagement = clamp(forwardLeanScore + stabilityScore + eyesOpenScore, 0, 100);

    // Exponential Moving Average smoothing
    const alpha = 0.25;
    smoothedRef.current.confidence = Math.round(smoothedRef.current.confidence * (1 - alpha) + rawConfidence * alpha);
    smoothedRef.current.stress = Math.round(smoothedRef.current.stress * (1 - alpha) + rawStress * alpha);
    smoothedRef.current.engagement = Math.round(smoothedRef.current.engagement * (1 - alpha) + rawEngagement * alpha);

    setScores({
      confidence: smoothedRef.current.confidence,
      stress: smoothedRef.current.stress,
      engagement: smoothedRef.current.engagement,
      isFaceDetected: true,
      isLoading: false,
      error: null,
    });
  }, []);

  // Initialize MediaPipe FaceMesh
  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const initFaceMesh = async () => {
      try {
        let FaceMeshClass = (window as any).FaceMesh;

        if (!FaceMeshClass) {
          try {
            const mpModule = await import('@mediapipe/face_mesh');
            FaceMeshClass = mpModule.FaceMesh || (window as any).FaceMesh;
          } catch {
            // fallback to CDN script if direct module bundle is unavailable
          }
        }

        if (!FaceMeshClass) {
          await new Promise<void>((resolve, reject) => {
            if ((window as any).FaceMesh) return resolve();
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
            script.crossOrigin = 'anonymous';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load FaceMesh library from CDN.'));
            document.head.appendChild(script);
          });
          FaceMeshClass = (window as any).FaceMesh;
        }

        if (!isMounted || !FaceMeshClass) return;

        const faceMesh = new FaceMeshClass({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results: any) => {
          if (!isMounted) return;
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            processLandmarks(results.multiFaceLandmarks[0]);
          } else {
            setScores(prev => ({
              ...prev,
              isFaceDetected: false,
              confidence: 0,
              stress: 0,
              engagement: 0,
              isLoading: false,
            }));
          }
        });

        faceMeshRef.current = faceMesh;
        setScores(prev => ({ ...prev, isLoading: false, error: null }));
      } catch (err: any) {
        console.warn('FaceMesh initialization notice:', err);
        if (isMounted) {
          setScores(prev => ({
            ...prev,
            isLoading: false,
            error: err.message || 'Face detection could not start.',
          }));
        }
      }
    };

    initFaceMesh();

    return () => {
      isMounted = false;
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, [enabled, processLandmarks]);

  // Handle Webcam streaming and detection loop
  useEffect(() => {
    if (!enabled) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      setScores({
        confidence: 0,
        stress: 0,
        engagement: 0,
        isFaceDetected: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    let isStreamActive = true;

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!isStreamActive) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Detection loop: process every 4th/5th frame to preserve CPU performance
        const processFrame = async () => {
          if (!isStreamActive) return;

          frameCountRef.current += 1;

          if (
            frameCountRef.current % 4 === 0 &&
            faceMeshRef.current &&
            videoRef.current &&
            videoRef.current.readyState >= 2
          ) {
            try {
              await faceMeshRef.current.send({ image: videoRef.current });
            } catch {
              // Frame processing catch
            }
          }

          animFrameIdRef.current = requestAnimationFrame(processFrame);
        };

        animFrameIdRef.current = requestAnimationFrame(processFrame);
      } catch (err: any) {
        console.warn('Webcam permission or access issue:', err);
        if (isStreamActive) {
          setScores(prev => ({
            ...prev,
            isLoading: false,
            error: err.name === 'NotAllowedError'
              ? 'Camera permission was denied. Text-only mode active.'
              : 'Webcam not available.',
          }));
        }
      }
    };

    startWebcam();

    return () => {
      isStreamActive = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [enabled]);

  return {
    ...scores,
    videoRef,
  };
};
