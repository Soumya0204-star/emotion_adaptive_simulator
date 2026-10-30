import React, { useEffect, useRef } from 'react';
import { useSession } from '@/hooks/useSession';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { FaceTracker } from '@/components/vision/FaceTracker';
import { useFaceEmotion } from '@/hooks/useFaceEmotion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Brain,
  Download,
  Copy,
  Check,
  Sparkles,
  Bot,
  UserCheck,
  Award,
} from 'lucide-react';

export const ChatInterface: React.FC = () => {
  const {
    sessionId,
    participantId,
    role,
    difficulty,
    isBaseline,
    messages,
    isTyping,
    sessionEnded,
    sendMessage,
    showReportModal,
    setShowReportModal,
    currentReport,
    currentSummary,
    startNewSession,
  } = useSession();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);
  const [isCameraOn, setIsCameraOn] = React.useState<boolean>(true);

  // Real-time Facial Emotion Tracker
  const faceEmotion = useFaceEmotion(isCameraOn);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleCopyReport = () => {
    if (currentReport) {
      navigator.clipboard.writeText(currentReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadReport = () => {
    if (!currentReport) return;
    const blob = new Blob([currentReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session_${sessionId.slice(0, 8)}_report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background relative">
      {/* Top Header Bar */}
      <header className="h-16 border-b px-6 flex items-center justify-between bg-card/40 backdrop-blur-md z-10">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
              <span>{role} Simulation</span>
              <Badge variant="outline" className="text-xs font-normal">
                {difficulty}
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              Participant: <span className="font-mono text-foreground font-semibold">{participantId}</span> · Session: <span className="font-mono">{sessionId.slice(0, 8)}</span>
            </p>
          </div>
        </div>

        {/* Experiment Mode Banner */}
        <div className="flex items-center gap-3">
          {isBaseline ? (
            <Badge
              variant="warning"
              className="px-3 py-1 text-xs gap-1.5 font-semibold animate-pulse"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              🔒 BASELINE MODE (Control: Adaptation Disabled)
            </Badge>
          ) : (
            <Badge
              variant="info"
              className="px-3 py-1 text-xs gap-1.5 font-semibold bg-blue-500/10 border-blue-500/30 text-blue-500 dark:text-blue-400"
            >
              <Brain className="h-3.5 w-3.5 text-blue-400" />
              🧠 ADAPTIVE MODE (Dynamic State Estimation Active)
            </Badge>
          )}
        </div>
      </header>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          /* Empty / Welcome State */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white mb-4 shadow-xl shadow-blue-500/20">
              <Bot className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-2">
              Ready for your {role} Simulation
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              The AI interviewer will evaluate your answers, detect confidence, stress, and hesitation, and dynamically calibrate its questions.
            </p>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              <div className="p-3 rounded-xl border bg-card/60 backdrop-blur-sm">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" /> Dynamic Calibration
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Questions adapt in difficulty based on your emotional state and answer depth.
                </p>
              </div>

              <div className="p-3 rounded-xl border bg-card/60 backdrop-blur-sm">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" /> Full Evaluation
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Click "End Session" anytime to review your comprehensive Interaction Report.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-6 font-medium">
              👉 Introduce yourself or say "Hello, I am ready" below to begin!
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-3 my-4">
                <div className="h-9 w-9 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5 text-indigo-400 animate-pulse" />
                </div>
                <div className="bg-muted/70 backdrop-blur-md border border-border/80 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      AI is evaluating & typing
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Webcam Face Emotion Tracker */}
      {isCameraOn && (
        <FaceTracker emotionData={faceEmotion} onClose={() => setIsCameraOn(false)} />
      )}

      {/* Chat Input Bar */}
      <ChatInput
        onSend={sendMessage}
        disabled={sessionEnded || isTyping}
        isCameraOn={isCameraOn}
        onToggleCamera={() => setIsCameraOn(prev => !prev)}
        currentFaceMetrics={faceEmotion}
      />

      {/* End Session Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-3xl" onClose={() => setShowReportModal(false)}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Award className="h-6 w-6" />
              <DialogTitle>Session Interaction Report</DialogTitle>
            </div>
            <DialogDescription>
              Performance breakdown and diagnostic analytics for Session {sessionId.slice(0, 8)} ({role} · {difficulty}).
            </DialogDescription>
          </DialogHeader>

          {currentSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="p-3 rounded-xl border bg-muted/40 text-center">
                <span className="text-xs text-muted-foreground">Quality</span>
                <p className="text-xl font-bold text-foreground mt-0.5">
                  {currentSummary.avg_quality !== null ? `${Math.round(currentSummary.avg_quality)}%` : 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-xl border bg-muted/40 text-center">
                <span className="text-xs text-muted-foreground">Confidence</span>
                <p className="text-xl font-bold text-blue-500 mt-0.5">
                  {currentSummary.avg_confidence !== null ? `${Math.round(currentSummary.avg_confidence)}%` : 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-xl border bg-muted/40 text-center">
                <span className="text-xs text-muted-foreground">Engagement</span>
                <p className="text-xl font-bold text-emerald-500 mt-0.5">
                  {currentSummary.avg_engagement !== null ? `${Math.round(currentSummary.avg_engagement)}%` : 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-xl border bg-muted/40 text-center">
                <span className="text-xs text-muted-foreground">Final Skill Level</span>
                <p className="text-xl font-bold text-purple-500 mt-0.5">
                  {currentSummary.final_skill_level || 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* ASCII Report Display */}
          <div className="relative">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed shadow-inner max-h-72 overflow-y-auto">
              {currentReport || 'No report generated for this session yet.'}
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyReport}
              className="absolute top-2 right-2 gap-1.5 h-8 text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <DialogFooter className="flex-row items-center justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={handleDownloadReport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Report (.txt)
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="default"
                onClick={() => {
                  setShowReportModal(false);
                  startNewSession();
                }}
              >
                Start New Session
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
