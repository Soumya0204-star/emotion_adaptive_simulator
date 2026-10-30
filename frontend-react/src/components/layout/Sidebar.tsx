import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  LayoutDashboard,
  Sun,
  Moon,
  RotateCcw,
  StopCircle,
  Sparkles,
  FlaskConical,
  User,
  BrainCircuit,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const PRESET_ROLES = [
  'Data Scientist',
  'Software Engineer',
  'Product Manager',
  'Machine Learning Engineer',
  'Cybersecurity Analyst',
  'System Architect',
];

export const Sidebar: React.FC = () => {
  const {
    sessionId,
    participantId,
    setParticipantId,
    role,
    setRole,
    difficulty,
    setDifficulty,
    isBaseline,
    setIsBaseline,
    theme,
    toggleTheme,
    startNewSession,
    endSession,
    sessionEnded,
    backendConnected,
    isTyping,
  } = useSession();

  const location = useLocation();

  return (
    <aside className="w-80 h-screen flex flex-col border-r bg-card/60 backdrop-blur-xl shrink-0 overflow-y-auto z-20 transition-colors">
      {/* Brand Header */}
      <div className="p-5 border-b flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Adaptive Sim
            </h1>
            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              {backendConnected ? 'Backend Connected' : 'Backend Offline'}
            </p>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="rounded-lg h-9 w-9"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700" />
          )}
        </Button>
      </div>

      {/* Main Navigation */}
      <div className="p-4 space-y-1 border-b">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Navigation
        </p>
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`
          }
        >
          <MessageSquare className="h-4 w-4" />
          <span>Interactive Chat</span>
          {isTyping && location.pathname !== '/' && (
            <span className="ml-auto h-2 w-2 rounded-full bg-blue-400 animate-ping" />
          )}
        </NavLink>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`
          }
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Analytics & Progress</span>
        </NavLink>
      </div>

      {/* Session Controls Section */}
      <div className="p-4 space-y-4 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Session Configuration
          </p>
          <Badge variant="outline" className="text-[10px] font-mono py-0">
            ID: {sessionId.slice(0, 6)}
          </Badge>
        </div>

        {/* Participant ID */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" /> Participant ID
          </label>
          <Input
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            placeholder="e.g. P001"
            className="h-9 text-xs font-mono"
          />
        </div>

        {/* Role Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5" /> Target Role
          </label>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-9 text-xs"
          >
            {PRESET_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>

        {/* Difficulty */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Difficulty
          </label>
          <Select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="h-9 text-xs"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </Select>
        </div>

        {/* Experiment Mode Switch */}
        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="baseline-switch"
              className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <FlaskConical className="h-3.5 w-3.5 text-indigo-400" />
              Experiment Mode
            </label>
            <Switch
              id="baseline-switch"
              checked={isBaseline}
              onCheckedChange={setIsBaseline}
            />
          </div>

          <div
            className={`p-2.5 rounded-lg border text-[11px] transition-all ${
              isBaseline
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isBaseline ? (
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>Baseline (Control Group)</strong>
                  <br />
                  Adaptation is disabled. AI asks uniform follow-ups.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>Adaptive (Experimental)</strong>
                  <br />
                  AI analyzes emotions and dynamically shifts difficulty.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons (Footer) */}
      <div className="p-4 border-t space-y-2 bg-card/40">
        <Button
          variant="destructive"
          onClick={endSession}
          disabled={sessionEnded}
          className="w-full justify-center gap-2 h-10 shadow-sm"
        >
          <StopCircle className="h-4 w-4" />
          {sessionEnded ? 'Session Ended' : 'End Session & Report'}
        </Button>

        <Button
          variant="outline"
          onClick={startNewSession}
          className="w-full justify-center gap-2 h-10 border-dashed hover:border-solid"
        >
          <RotateCcw className="h-4 w-4" />
          Start New Session
        </Button>
      </div>
    </aside>
  );
};
