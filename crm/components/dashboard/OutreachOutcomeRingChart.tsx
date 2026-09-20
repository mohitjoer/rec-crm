'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Card, CardTitle } from '@/components/ui/card';
import {
  RingChart,
  Ring,
  RingCenter,
  Legend,
  LegendItemComponent,
  LegendMarker,
  LegendLabel,
  LegendValue,
  LegendProgress,
  RingDataItem,
} from '@/components/charts';
import { CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { DashboardStats } from '@/lib/types';
import { fetcher } from '@/lib/fetcher';

interface OutreachOutcomeRingChartProps {
  outcome?: {
    completed: number;
    responded: number;
    notResponded: number;
    totalSessions: number;
  };
}

const DEFAULT_OUTCOME_DATA = {
  completed: 0,
  responded: 0,
  notResponded: 0,
  totalSessions: 0,
};

export function OutreachOutcomeRingChart({ outcome }: OutreachOutcomeRingChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { data: statsData } = useSWR<{ stats: DashboardStats }>(
    outcome ? null : '/api/dashboard/stats',
    fetcher,
    { revalidateOnFocus: false }
  );

  const outcomeData = outcome || statsData?.stats?.outreachOutcome || DEFAULT_OUTCOME_DATA;

  const ringData: RingDataItem[] = useMemo(() => {
    const target = outcomeData.totalSessions > 0 ? outcomeData.totalSessions : 1;
    return [
      {
        label: 'Completed',
        value: outcomeData.completed,
        target,
        color: isDark ? '#ffffff' : '#18181b',
      },
      {
        label: 'Responded',
        value: outcomeData.responded,
        target,
        color: isDark ? '#a1a1aa' : '#71717a',
      },
      {
        label: 'Not Responded',
        value: outcomeData.notResponded,
        target,
        color: isDark ? '#52525b' : '#d4d4d8',
      },
    ];
  }, [outcomeData.completed, outcomeData.responded, outcomeData.notResponded, outcomeData.totalSessions, isDark]);

  return (
    <Card className="min-w-0 p-5 space-y-4 h-full flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-200 dark:border-[#202024] transition-colors">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
              Outcome &amp; Engagement
            </CardTitle>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Responded, not responded &amp; completed sessions
          </p>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
          {outcomeData.totalSessions.toLocaleString()} Sessions
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-around gap-4 py-1">
        {outcomeData.totalSessions === 0 ? (
          <div className="w-full py-10 text-center text-xs text-zinc-500">
            No outreach sessions recorded yet.
          </div>
        ) : (
          <>
            {/* RingChart Component */}
            <div className="flex items-center justify-center shrink-0">
              <RingChart
                data={ringData}
                hoveredIndex={hoveredIndex}
                onHoverChange={setHoveredIndex}
                size={180}
              >
                {ringData.map((item, i) => (
                  <Ring index={i} key={item.label} />
                ))}
                <RingCenter defaultLabel="Sessions" />
              </RingChart>
            </div>

            {/* Legend Component */}
            <div className="min-w-0 basis-[220px] flex-1 max-w-[320px]">
              <Legend
                hoveredIndex={hoveredIndex}
                items={ringData}
                onHoverChange={setHoveredIndex}
              >
                <LegendItemComponent>
                  <LegendMarker />
                  <LegendLabel />
                  <LegendValue showPercentage />
                  <LegendProgress />
                </LegendItemComponent>
              </Legend>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
