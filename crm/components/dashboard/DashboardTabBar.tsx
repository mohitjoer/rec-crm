'use client';

import React from 'react';
import {
  Layers,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface DashboardTabBarProps {
  activeTab: 'all' | 'overdue' | 'ptp' | 'settled';
  setActiveTab: (tab: 'all' | 'overdue' | 'ptp' | 'settled') => void;
  totalCount: number;
  overdueCount: number;
  ptpCount: number;
  settledCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  dpdFilter: 'all' | '30' | '60' | '90';
  setDpdFilter: (dpd: 'all' | '30' | '60' | '90') => void;
  showFilterDropdown: boolean;
  setShowFilterDropdown: (show: boolean) => void;
}

export function DashboardTabBar({
  activeTab,
  setActiveTab,
  totalCount,
  overdueCount,
  ptpCount,
  settledCount,
  searchQuery,
  setSearchQuery,
  dpdFilter,
  setDpdFilter,
  showFilterDropdown,
  setShowFilterDropdown,
}: DashboardTabBarProps) {
  return (
    <div className="flex min-w-0 flex-col 2xl:flex-row 2xl:items-center justify-between gap-3 pb-1">
      {/* Segmented Pill Tabs */}
      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto py-1 [&>button]:shrink-0">
        <Button
          size="sm"
          variant={activeTab === 'all' ? 'secondary' : 'ghost'}
          onClick={() => setActiveTab('all')}
          className={`gap-2 transition-colors ${
            activeTab === 'all'
              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-[#1c1c20] dark:text-white dark:border-[#2c2c32]'
              : ''
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Accounts</span>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] ml-1">
            {totalCount}
          </Badge>
        </Button>

        <Button
          size="sm"
          variant={activeTab === 'overdue' ? 'secondary' : 'ghost'}
          onClick={() => setActiveTab('overdue')}
          className={`gap-2 transition-colors ${
            activeTab === 'overdue'
              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-[#1c1c20] dark:text-white dark:border-[#2c2c32]'
              : ''
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Overdue DPD 30+</span>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] ml-1">
            {overdueCount}
          </Badge>
        </Button>

        <Button
          size="sm"
          variant={activeTab === 'ptp' ? 'secondary' : 'ghost'}
          onClick={() => setActiveTab('ptp')}
          className={`gap-2 transition-colors ${
            activeTab === 'ptp'
              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-[#1c1c20] dark:text-white dark:border-[#2c2c32]'
              : ''
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>PTP Scheduled</span>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] ml-1">
            {ptpCount}
          </Badge>
        </Button>

        <Button
          size="sm"
          variant={activeTab === 'settled' ? 'secondary' : 'ghost'}
          onClick={() => setActiveTab('settled')}
          className={`gap-2 transition-colors ${
            activeTab === 'settled'
              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-[#1c1c20] dark:text-white dark:border-[#2c2c32]'
              : ''
          }`}
        >
          <span>Settled</span>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] ml-1">
            {settledCount}
          </Badge>
        </Button>
      </div>

      {/* Search & Filter Dropdown */}
      <div className="flex min-w-0 items-center gap-2 2xl:shrink-0">
        <div className="relative min-w-0 flex-1 2xl:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-2.5" />
          <Input
            placeholder="Search debtor, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-white dark:bg-[#121214] border-zinc-200 dark:border-[#242428]"
          />
        </div>

        <div className="relative">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="h-8 gap-1.5 text-xs text-zinc-700 dark:text-zinc-300"
          >
            <Filter className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
            <span>Filter</span>
          </Button>

          {showFilterDropdown && (
            <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#242428] shadow-2xl p-1.5 z-20 text-xs space-y-0.5">
              <button
                onClick={() => {
                  setDpdFilter('all');
                  setShowFilterDropdown(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors ${
                  dpdFilter === 'all'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
                }`}
              >
                All Aging Brackets
              </button>
              <button
                onClick={() => {
                  setDpdFilter('30');
                  setShowFilterDropdown(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors ${
                  dpdFilter === '30'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
                }`}
              >
                30+ Days Past Due
              </button>
              <button
                onClick={() => {
                  setDpdFilter('60');
                  setShowFilterDropdown(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors ${
                  dpdFilter === '60'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
                }`}
              >
                60+ Days Past Due
              </button>
              <button
                onClick={() => {
                  setDpdFilter('90');
                  setShowFilterDropdown(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors ${
                  dpdFilter === '90'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
                }`}
              >
                90+ Days Past Due
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
