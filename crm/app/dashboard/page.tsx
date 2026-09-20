'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Account, DashboardStats } from '@/lib/types';
import { fetcher } from '@/lib/fetcher';
import { Badge } from '@/components/ui/badge';
import { DashboardTabBar } from '@/components/dashboard/DashboardTabBar';
import { MasterAccountTable } from '@/components/dashboard/MasterAccountTable';
import { DailyInteractionsChart } from '@/components/dashboard/DailyInteractionsChart';
import { ChannelInteractionsChart } from '@/components/dashboard/ChannelInteractionsChart';
import { OutreachOutcomeRingChart } from '@/components/dashboard/OutreachOutcomeRingChart';

const EMPTY_ACCOUNTS: Account[] = [];

export default function DashboardPage() {
  const { data: accountsData } = useSWR<{ accounts: Account[] }>('/api/accounts', fetcher, {
    revalidateOnFocus: false,
  });
  const { data: statsData } = useSWR<{ stats: DashboardStats }>('/api/dashboard/stats', fetcher, {
    revalidateOnFocus: false,
  });

  const accounts = accountsData?.accounts ?? EMPTY_ACCOUNTS;
  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'ptp' | 'settled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dpdFilter, setDpdFilter] = useState<'all' | '30' | '60' | '90'>('all');

  const filteredAccounts = accounts.filter((acc) => {
    if (activeTab === 'overdue' && (acc.daysPastDue < 30 || acc.status === 'SETTLED')) return false;
    if (activeTab === 'ptp' && acc.status !== 'PROMISE_TO_PAY') return false;
    if (activeTab === 'settled' && acc.status !== 'SETTLED') return false;

    if (dpdFilter === '30' && acc.daysPastDue < 30) return false;
    if (dpdFilter === '60' && acc.daysPastDue < 60) return false;
    if (dpdFilter === '90' && acc.daysPastDue < 90) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = acc.name.toLowerCase().includes(q);
      const matchId = acc.id.toLowerCase().includes(q);
      const matchCreditor = acc.originalCreditor.toLowerCase().includes(q);
      return matchName || matchId || matchCreditor;
    }

    return true;
  });

  const totalCount = accounts.length;
  const overdueCount = accounts.filter((a) => a.daysPastDue >= 30 && a.status !== 'SETTLED').length;
  const ptpCount = accounts.filter((a) => a.status === 'PROMISE_TO_PAY').length;
  const settledCount = accounts.filter((a) => a.status === 'SETTLED').length;

  const renderStatusBadge = (status: string, daysPastDue: number) => {
    switch (status) {
      case 'PROMISE_TO_PAY':
        return <Badge variant="success">Promise to Pay</Badge>;
      case 'HARDSHIP_HOLD':
        return <Badge variant="purple">Hardship Hold</Badge>;
      case 'DISPUTED':
        return <Badge variant="secondary">Disputed</Badge>;
      case 'SETTLED':
        return <Badge variant="outline">Settled</Badge>;
      case 'DELINQUENT':
      default:
        return <Badge variant="warning">{daysPastDue} DPD</Badge>;
    }
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* Daily Interactions Made Trend */}
      <DailyInteractionsChart
        dailyTrend={statsData?.stats?.dailyTrend}
        summary={statsData?.stats?.trendSummary}
      />

      {/* Autonomous Interactions Breakdown & Outcome Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <ChannelInteractionsChart breakdown={statsData?.stats?.channelBreakdown} />
        <OutreachOutcomeRingChart outcome={statsData?.stats?.outreachOutcome} />
      </div>

      {/* Top Filter & Tab Bar */}
      <DashboardTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalCount={totalCount}
        overdueCount={overdueCount}
        ptpCount={ptpCount}
        settledCount={settledCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dpdFilter={dpdFilter}
        setDpdFilter={setDpdFilter}
        showFilterDropdown={showFilterDropdown}
        setShowFilterDropdown={setShowFilterDropdown}
      />

      {/* Master Accounts Ledger Table */}
      <MasterAccountTable
        accounts={filteredAccounts}
        renderStatusBadge={renderStatusBadge}
      />
    </div>
  );
}
