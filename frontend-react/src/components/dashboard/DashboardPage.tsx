import React from 'react';
import { useSession } from '@/hooks/useSession';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { ProgressChart } from '@/components/dashboard/ProgressChart';
import { SessionDetail } from '@/components/dashboard/SessionDetail';
import { ExportCSV } from '@/components/dashboard/ExportCSV';
import { Button } from '@/components/ui/button';
import { RotateCw, LayoutDashboard } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { pastSessions, refreshPastSessions } = useSession();

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-background p-6 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            Evaluation & Progress Dashboard
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Research experiment analytics, longitudinal performance trends, and baseline comparisons.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refreshPastSessions}
          className="gap-2 self-start sm:self-auto"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Refresh Data
        </Button>
      </div>

      {pastSessions.length === 0 ? (
        <div className="p-12 text-center border rounded-2xl bg-card/50">
          <p className="text-base font-semibold">No completed sessions found yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Start a simulation in the Interactive Chat and click "End Session" to record data here.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards + Experiment Comparison */}
          <SummaryCards sessions={pastSessions} />

          {/* Longitudinal Progress Chart */}
          <ProgressChart sessions={pastSessions} />

          {/* Thesis CSV Export Bar */}
          <ExportCSV sessions={pastSessions} />

          {/* Granular Past Session Inspector */}
          <SessionDetail sessions={pastSessions} />
        </>
      )}
    </div>
  );
};
