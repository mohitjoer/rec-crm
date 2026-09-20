'use client';

import React, { useMemo } from 'react';
import useSWR from 'swr';
import { Card, CardTitle } from '@/components/ui/card';
import { PieChart, PieSlice, PieCenter, PieDataItem } from '@/components/charts';
import { Phone, MessageSquare, Mail, Split } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { DashboardStats } from '@/lib/types';
import { fetcher } from '@/lib/fetcher';

interface ChannelInteractionsChartProps {
  breakdown?: {
    voice: number;
    message: number;
    email: number;
    total: number;
  };
}

const DEFAULT_CHANNEL_BREAKDOWN = {
  voice: 0,
  message: 0,
  email: 0,
  total: 0,
};

export function ChannelInteractionsChart({ breakdown }: ChannelInteractionsChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { data: statsData } = useSWR<{ stats: DashboardStats }>(
    breakdown ? null : '/api/dashboard/stats',
    fetcher,
    { revalidateOnFocus: false }
  );

  const channelData = breakdown || statsData?.stats?.channelBreakdown || DEFAULT_CHANNEL_BREAKDOWN;

  const total = channelData.total;

  const pieData: PieDataItem[] = useMemo(() => {
    return [
      { label: 'Voice', value: channelData.voice, color: isDark ? '#ffffff' : '#18181b' },
      { label: 'Message', value: channelData.message, color: isDark ? '#a1a1aa' : '#71717a' },
      { label: 'Email', value: channelData.email, color: isDark ? '#52525b' : '#a1a1aa' },
    ];
  }, [channelData.voice, channelData.message, channelData.email, isDark]);

  return (
    <Card className="min-w-0 p-5 space-y-4 h-full flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-200 dark:border-[#202024] transition-colors">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Split className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
              Channel Breakdown
            </CardTitle>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Voice AI, SMS &amp; email separation
          </p>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
          {total.toLocaleString()} Total
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-around gap-4 py-1">
        {total === 0 ? (
          <div className="w-full py-10 text-center text-xs text-zinc-500">
            No interactions logged across channels yet.
          </div>
        ) : (
          <>
            {/* PieChart Component */}
            <div className="flex items-center justify-center">
              <PieChart data={pieData} innerRadius={55} size={180}>
                {pieData.map((item, index) => (
                  <PieSlice hoverEffect="grow" index={index} key={item.label} />
                ))}
                <PieCenter defaultLabel="Channels" />
              </PieChart>
            </div>

            {/* Channel Details Legend */}
            <div className="flex min-w-0 basis-[220px] flex-1 max-w-[320px] flex-col gap-2.5">
              {pieData.map((item) => {
                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 text-xs bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
                        {item.label === 'Voice' && <Phone className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />}
                        {item.label === 'Message' && <MessageSquare className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />}
                        {item.label === 'Email' && <Mail className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />}
                        <span>{item.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-zinc-900 dark:text-white font-semibold">{item.value.toLocaleString()}</span>
                      <span className="text-zinc-500 text-[10px]">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
