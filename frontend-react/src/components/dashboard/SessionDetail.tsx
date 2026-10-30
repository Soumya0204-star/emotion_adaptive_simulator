import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PastSession } from '@/context/SessionContext';
import { Download, FileText, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';

interface SessionDetailProps {
  sessions: PastSession[];
}

export const SessionDetail: React.FC<SessionDetailProps> = ({ sessions }) => {
  const [selectedId, setSelectedId] = useState<string>(() => {
    return sessions.length ? sessions[0].summary.session_id : '';
  });
  const [copied, setCopied] = useState(false);

  const selectedSession =
    sessions.find(s => s.summary.session_id === selectedId) || sessions[0];

  if (!selectedSession) {
    return null;
  }

  const s = selectedSession.summary;

  const handleDownload = () => {
    const blob = new Blob([selectedSession.report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session_${s.session_id.slice(0, 8)}_report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedSession.report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Derive strength and weakness
  const scores: Record<string, number | null> = {
    'Technical Quality': s.avg_quality,
    'Answer Relevance': s.avg_relevance,
    'Confidence': s.avg_confidence,
    'Engagement': s.avg_engagement,
  };

  const validEntries = Object.entries(scores).filter(([, v]) => v !== null) as [string, number][];
  let strength = 'Consistent performance';
  let weakness = 'None highlighted';
  if (validEntries.length > 0) {
    validEntries.sort((a, b) => b[1] - a[1]);
    strength = validEntries[0][0];
    weakness = validEntries[validEntries.length - 1][0];
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Session Inspection & Diagnostic Report
            </CardTitle>
            <CardDescription className="text-xs">
              Deep-dive into granular NLP scores and generated diagnostic text
            </CardDescription>
          </div>

          {/* Session Selector */}
          <div className="w-full sm:w-72">
            <Select
              value={selectedSession.summary.session_id}
              onChange={(e) => setSelectedId(e.target.value)}
              className="text-xs h-9"
            >
              {sessions.map((sess, i) => (
                <option key={sess.summary.session_id} value={sess.summary.session_id}>
                  Session {i + 1} — {sess.summary.role} ({sess.summary.session_id.slice(0, 6)})
                </option>
              ))}
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Badges & Meta row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              Participant: {s.user_id || 'P001'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {s.role} ({s.difficulty})
            </Badge>
            <Badge
              variant={s.mode === 'baseline' ? 'warning' : 'purple'}
              className="text-xs uppercase"
            >
              {s.mode} mode
            </Badge>
            <Badge variant="default" className="text-xs">
              Skill: {s.final_skill_level || 'Intermediate'}
            </Badge>
          </div>

          <span className="text-xs text-muted-foreground">
            {s.total_exchanges} Total Exchanges
          </span>
        </div>

        {/* 5-Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl border bg-muted/40 text-center">
            <span className="text-[11px] text-muted-foreground uppercase">Quality</span>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {s.avg_quality !== null ? `${Math.round(s.avg_quality)}%` : 'N/A'}
            </p>
          </div>
          <div className="p-3 rounded-xl border bg-muted/40 text-center">
            <span className="text-[11px] text-muted-foreground uppercase">Relevance</span>
            <p className="text-lg font-bold text-blue-500 mt-0.5">
              {s.avg_relevance !== null ? `${Math.round(s.avg_relevance)}%` : 'N/A'}
            </p>
          </div>
          <div className="p-3 rounded-xl border bg-muted/40 text-center">
            <span className="text-[11px] text-muted-foreground uppercase">Confidence</span>
            <p className="text-lg font-bold text-emerald-500 mt-0.5">
              {s.avg_confidence !== null ? `${Math.round(s.avg_confidence)}%` : 'N/A'}
            </p>
          </div>
          <div className="p-3 rounded-xl border bg-muted/40 text-center">
            <span className="text-[11px] text-muted-foreground uppercase">Stress</span>
            <p className="text-lg font-bold text-amber-500 mt-0.5">
              {s.avg_stress !== null ? `${Math.round(s.avg_stress)}%` : 'N/A'}
            </p>
          </div>
          <div className="p-3 rounded-xl border bg-muted/40 text-center col-span-2 sm:col-span-1">
            <span className="text-[11px] text-muted-foreground uppercase">Engagement</span>
            <p className="text-lg font-bold text-purple-500 mt-0.5">
              {s.avg_engagement !== null ? `${Math.round(s.avg_engagement)}%` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Strengths & Weaknesses Callouts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-500">
                Identified Strength
              </p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {strength}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-500">
                Needs Improvement
              </p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {weakness}
              </p>
            </div>
          </div>
        </div>

        {/* Formatted Report Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Diagnostic Text Report
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 text-xs gap-1.5"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-8 text-xs gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Download (.txt)
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed shadow-inner max-h-56 overflow-y-auto">
            {selectedSession.report}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
