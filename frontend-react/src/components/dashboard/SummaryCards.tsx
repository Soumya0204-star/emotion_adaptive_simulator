import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PastSession } from '@/context/SessionContext';
import {
  Activity,
  Award,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  FlaskConical,
  Sparkles,
} from 'lucide-react';

interface SummaryCardsProps {
  sessions: PastSession[];
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ sessions }) => {
  const totalSessions = sessions.length;

  const validConfidence = sessions.map(s => s.summary.avg_confidence).filter((v): v is number => v !== null);
  const validQuality = sessions.map(s => s.summary.avg_quality).filter((v): v is number => v !== null);
  const validEngagement = sessions.map(s => s.summary.avg_engagement).filter((v): v is number => v !== null);

  const avgConfidence = validConfidence.length
    ? Math.round((validConfidence.reduce((a, b) => a + b, 0) / validConfidence.length) * 10) / 10
    : 0;

  const avgQuality = validQuality.length
    ? Math.round((validQuality.reduce((a, b) => a + b, 0) / validQuality.length) * 10) / 10
    : 0;

  // Split Baseline vs Adaptive
  const baselineSessions = sessions.filter(s => s.summary.mode === 'baseline');
  const adaptiveSessions = sessions.filter(s => s.summary.mode === 'adaptive');

  const getAvg = (list: PastSession[], key: 'avg_confidence' | 'avg_quality' | 'avg_engagement' | 'total_exchanges') => {
    const vals = list.map(s => s.summary[key]).filter((v): v is number => v !== null && v !== undefined);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const bConf = getAvg(baselineSessions, 'avg_confidence');
  const aConf = getAvg(adaptiveSessions, 'avg_confidence');
  const deltaConf = aConf !== null && bConf !== null ? aConf - bConf : null;

  const bQual = getAvg(baselineSessions, 'avg_quality');
  const aQual = getAvg(adaptiveSessions, 'avg_quality');
  const deltaQual = aQual !== null && bQual !== null ? aQual - bQual : null;

  const bEng = getAvg(baselineSessions, 'avg_engagement');
  const aEng = getAvg(adaptiveSessions, 'avg_engagement');
  const deltaEng = aEng !== null && bEng !== null ? aEng - bEng : null;

  const bExch = getAvg(baselineSessions, 'total_exchanges');
  const aExch = getAvg(adaptiveSessions, 'total_exchanges');
  const deltaExch = aExch !== null && bExch !== null ? aExch - bExch : null;

  const renderDelta = (delta: number | null, unit: string = '%') => {
    if (delta === null) return <span className="text-muted-foreground text-xs">N/A</span>;
    const isPositive = delta > 0;
    const isZero = delta === 0;

    return (
      <div
        className={`flex items-center gap-0.5 text-xs font-semibold ${
          isPositive
            ? 'text-emerald-500'
            : isZero
            ? 'text-muted-foreground'
            : 'text-rose-500'
        }`}
      >
        {isPositive ? (
          <ArrowUpRight className="h-3.5 w-3.5" />
        ) : isZero ? (
          <Minus className="h-3.5 w-3.5" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5" />
        )}
        <span>
          {isPositive ? '+' : ''}
          {delta.toFixed(1)}
          {unit}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Sessions
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed interview simulations
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Avg Confidence
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {avgConfidence}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aggregated across all candidates
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Avg Quality
            </CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {avgQuality}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Technical depth & completeness
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Thesis Experiment: Baseline vs Adaptive Comparison Panel */}
      <Card className="border-indigo-500/30 bg-gradient-to-br from-card via-card to-indigo-950/20 shadow-md">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-indigo-400" />
              <CardTitle className="text-base font-bold">
                Thesis Experiment: Baseline vs. Adaptive Condition
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Baseline (N={baselineSessions.length})
              </Badge>
              <Badge variant="purple" className="text-xs">
                Adaptive (N={adaptiveSessions.length})
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Confidence Metric */}
            <div className="p-3 rounded-xl border bg-background/50 backdrop-blur-sm space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">
                Confidence
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-foreground">
                  {aConf !== null ? `${aConf.toFixed(1)}%` : 'N/A'}
                </span>
                {renderDelta(deltaConf)}
              </div>
              <div className="text-[10px] text-muted-foreground flex justify-between pt-1 border-t">
                <span>Baseline: {bConf !== null ? `${bConf.toFixed(1)}%` : 'N/A'}</span>
                <span>Adaptive: {aConf !== null ? `${aConf.toFixed(1)}%` : 'N/A'}</span>
              </div>
            </div>

            {/* Quality Metric */}
            <div className="p-3 rounded-xl border bg-background/50 backdrop-blur-sm space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">
                Answer Quality
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-foreground">
                  {aQual !== null ? `${aQual.toFixed(1)}%` : 'N/A'}
                </span>
                {renderDelta(deltaQual)}
              </div>
              <div className="text-[10px] text-muted-foreground flex justify-between pt-1 border-t">
                <span>Baseline: {bQual !== null ? `${bQual.toFixed(1)}%` : 'N/A'}</span>
                <span>Adaptive: {aQual !== null ? `${aQual.toFixed(1)}%` : 'N/A'}</span>
              </div>
            </div>

            {/* Engagement Metric */}
            <div className="p-3 rounded-xl border bg-background/50 backdrop-blur-sm space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">
                Engagement
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-foreground">
                  {aEng !== null ? `${aEng.toFixed(1)}%` : 'N/A'}
                </span>
                {renderDelta(deltaEng)}
              </div>
              <div className="text-[10px] text-muted-foreground flex justify-between pt-1 border-t">
                <span>Baseline: {bEng !== null ? `${bEng.toFixed(1)}%` : 'N/A'}</span>
                <span>Adaptive: {aEng !== null ? `${aEng.toFixed(1)}%` : 'N/A'}</span>
              </div>
            </div>

            {/* Total Exchanges */}
            <div className="p-3 rounded-xl border bg-background/50 backdrop-blur-sm space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">
                Avg Exchanges
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-foreground">
                  {aExch !== null ? aExch.toFixed(1) : 'N/A'}
                </span>
                {renderDelta(deltaExch, '')}
              </div>
              <div className="text-[10px] text-muted-foreground flex justify-between pt-1 border-t">
                <span>Baseline: {bExch !== null ? bExch.toFixed(1) : 'N/A'}</span>
                <span>Adaptive: {aExch !== null ? aExch.toFixed(1) : 'N/A'}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span>
              <strong>Thesis Insight:</strong> Positive delta reflects performance gains attributable to real-time emotional scaffolding and difficulty calibration.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
