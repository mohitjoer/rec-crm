'use client';

import React from 'react';
import useSWR from 'swr';
import { Card, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, Grid, BarXAxis, ChartTooltip } from '@/components/charts';
import { Activity, Radio } from 'lucide-react';
import { DailyInteractionPoint, DashboardStats } from '@/lib/types';
import { fetcher } from '@/lib/fetcher';

interface DailyInteractionsChartProps {
  dailyTrend?: DailyInteractionPoint[];
  summary?: {
    total: number;
    avgPerDay: number;
    peak: number;
    daysCount: number;
  };
}

export function DailyInteractionsChart({ dailyTrend, summary }: DailyInteractionsChartProps) {
  const { data: statsData } = useSWR<{ stats: DashboardStats }>(
    dailyTrend ? null : '/api/dashboard/stats',
    fetcher,
    { revalidateOnFocus: false }
  );

  const data = dailyTrend || statsData?.stats?.dailyTrend || [];
  const trendSummary = summary || statsData?.stats?.trendSummary || {
    total: data.reduce((acc, curr) => acc + curr.value, 0),
    avgPerDay: 0,
    peak: 0,
    daysCount: data.length || 30,
  };

  return (
    <Card className="min-w-0 p-5 space-y-4 h-full flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200 dark:border-[#202024] transition-colors">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <Activity className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
              Interactions Made
            </CardTitle>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
              <Radio className="w-2 h-2 animate-pulse text-emerald-500" /> {trendSummary.daysCount}-Day Trend
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Daily autonomous voice, WhatsApp, and SMS touchpoints across delinquent accounts
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
          <div>
            <span className="text-zinc-400 dark:text-zinc-500">Total: </span>
            <span className="text-zinc-900 dark:text-white font-semibold">{trendSummary.total}</span>
          </div>
          <div>
            <span className="text-zinc-400 dark:text-zinc-500">Avg / Day: </span>
            <span className="text-zinc-900 dark:text-white font-semibold">{trendSummary.avgPerDay}</span>
          </div>
          <div>
            <span className="text-zinc-400 dark:text-zinc-500">Peak: </span>
            <span className="text-zinc-900 dark:text-white font-semibold">{trendSummary.peak}</span>
          </div>
        </div>
      </div>

      <div className="w-full min-w-0 overflow-x-auto pt-2" tabIndex={0} role="region" aria-label="Daily interactions chart; scroll horizontally to view all dates">
        {data.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            No interactions logged yet. Place a call to record daily activity.
          </div>
        ) : (
          <BarChart
            className="min-w-[700px] w-full"
            aspectRatio="4 / 1"
            barGap={0.15}
            data={data}
            margin={{ top: 8, right: 8, bottom: 40, left: 8 }}
            xDataKey="day"
          >
            <Grid horizontal />
            <Bar dataKey="value" lineCap="butt" fill="var(--chart-line-primary, #ffffff)" />
            <BarXAxis maxLabels={10} />
            <ChartTooltip />
          </BarChart>
        )}
      </div>
    </Card>
  );
}
