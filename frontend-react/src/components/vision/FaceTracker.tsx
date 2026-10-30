import React, { useState } from 'react';
import { FaceEmotionScores } from '@/hooks/useFaceEmotion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Camera,
  Eye,
  Smile,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface FaceTrackerProps {
  emotionData: FaceEmotionScores & {
    videoRef: any;
  };
  onClose?: () => void;
}

export const FaceTracker: React.FC<FaceTrackerProps> = ({
  emotionData,
  onClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    confidence,
    stress,
    engagement,
    isFaceDetected,
    isLoading,
    error,
    videoRef,
  } = emotionData;

  return (
    <div className="fixed bottom-24 right-6 z-40 w-72 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/50 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            {isFaceDetected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            )}
          </div>
          <span className="text-xs font-semibold tracking-tight text-foreground flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5 text-primary" />
            Facial Emotion Tracker
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 rounded-md hover:bg-muted text-muted-foreground"
            title={isCollapsed ? 'Expand camera preview' : 'Minimize preview'}
          >
            {isCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs"
              title="Turn off webcam"
            >
              ✕
            </Button>
          )}
        </div>
      </div>

      {/* Main Body */}
      {!isCollapsed && (
        <div className="p-3 space-y-3">
          {/* Webcam Preview Box */}
          <div className="relative aspect-video w-full rounded-xl bg-slate-950 overflow-hidden border border-border/60 shadow-inner flex items-center justify-center">
            {/* Native Video Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover -scale-x-100"
            />

            {/* Video Overlays */}
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Starting face model...</span>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 bg-background/90 backdrop-blur-sm p-3 flex flex-col items-center justify-center text-center text-xs text-destructive gap-1.5">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            {!isLoading && !error && !isFaceDetected && (
              <div className="absolute bottom-2 inset-x-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] text-amber-300 font-medium text-center border border-amber-500/30">
                Looking for face in frame...
              </div>
            )}

            {isFaceDetected && (
              <div className="absolute top-2 left-2 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 backdrop-blur-sm">
                <Sparkles className="h-2.5 w-2.5" /> Face Locked
              </div>
            )}
          </div>

          {/* Real-time Facial Emotion Metrics */}
          <div className="space-y-2">
            {/* Confidence Metric */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Smile className="h-3.5 w-3.5 text-blue-400" />
                  Confidence
                </span>
                <Badge variant="outline" className="px-1.5 py-0 text-[11px] font-mono text-blue-500 dark:text-blue-400 border-blue-500/30">
                  {confidence}%
                </Badge>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>

            {/* Stress Metric */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Zap className="h-3.5 w-3.5 text-rose-400" />
                  Stress
                </span>
                <Badge variant="outline" className="px-1.5 py-0 text-[11px] font-mono text-rose-500 dark:text-rose-400 border-rose-500/30">
                  {stress}%
                </Badge>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-300"
                  style={{ width: `${stress}%` }}
                />
              </div>
            </div>

            {/* Engagement Metric */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Eye className="h-3.5 w-3.5 text-emerald-400" />
                  Engagement
                </span>
                <Badge variant="outline" className="px-1.5 py-0 text-[11px] font-mono text-emerald-500 dark:text-emerald-400 border-emerald-500/30">
                  {engagement}%
                </Badge>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${engagement}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Compact State */}
      {isCollapsed && (
        <div className="px-3.5 py-2 flex items-center justify-between gap-2 text-xs">
          <span className="text-[11px] text-muted-foreground font-mono">
            {isFaceDetected ? 'Tracking active' : 'Scanning...'}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className="text-blue-400">C:{confidence}%</span>
            <span className="text-rose-400">S:{stress}%</span>
            <span className="text-emerald-400">E:{engagement}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
