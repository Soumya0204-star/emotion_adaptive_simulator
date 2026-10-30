import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PastSession } from '@/context/SessionContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ProgressChartProps {
  sessions: PastSession[];
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ sessions }) => {
  // Sort sessions chronologically (oldest to newest)
  const sortedSessions = [...sessions].sort((a, b) => {
    return new Date(a.summary.start_time).getTime() - new Date(b.summary.start_time).getTime();
  });

  const chartData = sortedSessions.map((s, index) => ({
    sessionNumber: `S${index + 1}`,
    fullId: s.summary.session_id.slice(0, 6),
    participant: s.summary.user_id || 'P001',
    role: s.summary.role || 'Data Scientist',
    mode: s.summary.mode === 'baseline' ? 'Baseline' : 'Adaptive',
    Confidence: s.summary.avg_confidence ? Math.round(s.summary.avg_confidence) : null,
    Quality: s.summary.avg_quality ? Math.round(s.summary.avg_quality) : null,
    Engagement: s.summary.avg_engagement ? Math.round(s.summary.avg_engagement) : null,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl border bg-card/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1.5">
          <div className="flex items-center justify-between gap-4 border-b pb-1 font-semibold">
            <span>{label} ({data.role})</span>
            <span className={data.mode === 'Baseline' ? 'text-amber-400' : 'text-indigo-400'}>
              {data.mode}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">Candidate: {data.participant}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <span style={{ color: entry.color }} className="font-medium">
                {entry.name}:
              </span>
              <span className="font-bold text-foreground">
                {entry.value !== null ? `${entry.value}%` : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold">
          Performance Trajectory Over Time
        </CardTitle>
        <CardDescription className="text-xs">
          Multi-metric progression across sequential interaction sessions (0% – 100%)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="sessionNumber"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ opacity: 0.3 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ opacity: 0.3 }}
                unit="%"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="Confidence"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 1.5, fill: '#1d4ed8' }}
                activeDot={{ r: 7 }}
                animationDuration={800}
              />
              <Line
                type="monotone"
                dataKey="Quality"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 1.5, fill: '#047857' }}
                activeDot={{ r: 7 }}
                animationDuration={1000}
              />
              <Line
                type="monotone"
                dataKey="Engagement"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 1.5, fill: '#6d28d9' }}
                activeDot={{ r: 7 }}
                animationDuration={1200}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
