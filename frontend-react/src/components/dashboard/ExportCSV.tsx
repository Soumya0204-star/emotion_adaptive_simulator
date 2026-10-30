import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PastSession } from '@/context/SessionContext';
import { Download, FileSpreadsheet, Sparkles } from 'lucide-react';

interface ExportCSVProps {
  sessions: PastSession[];
}

export const ExportCSV: React.FC<ExportCSVProps> = ({ sessions }) => {
  const handleExportCSV = () => {
    if (!sessions.length) {
      alert('No sessions available to export.');
      return;
    }

    const headers = [
      'session_id',
      'user_id',
      'user_name',
      'role',
      'difficulty',
      'mode',
      'start_time',
      'end_time',
      'avg_quality',
      'avg_confidence',
      'avg_stress',
      'avg_engagement',
      'avg_relevance',
      'final_skill_level',
      'total_exchanges',
    ];

    const rows = sessions.map((item) => {
      const s = item.summary;
      return [
        s.session_id,
        s.user_id || 'P001',
        `"${(s.user_name || 'Anonymous').replace(/"/g, '""')}"`,
        `"${(s.role || '').replace(/"/g, '""')}"`,
        s.difficulty || '',
        s.mode || 'adaptive',
        s.start_time || '',
        s.end_time || '',
        s.avg_quality !== null ? s.avg_quality : '',
        s.avg_confidence !== null ? s.avg_confidence : '',
        s.avg_stress !== null ? s.avg_stress : '',
        s.avg_engagement !== null ? s.avg_engagement : '',
        s.avg_relevance !== null ? s.avg_relevance : '',
        `"${(s.final_skill_level || '').replace(/"/g, '""')}"`,
        s.total_exchanges || 0,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'experiment_data.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-indigo-500/20 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-purple-900/10">
      <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-1.5">
              Export Thesis Experiment Data
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Download all {sessions.length} sessions as RFC-compliant CSV ready for Python Pandas, SPSS, or R analysis.
            </p>
          </div>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="gradient"
          className="gap-2 shrink-0 h-10 px-5"
        >
          <Download className="h-4 w-4" />
          Download CSV (experiment_data.csv)
        </Button>
      </CardContent>
    </Card>
  );
};
