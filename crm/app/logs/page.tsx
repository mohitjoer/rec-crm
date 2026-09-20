'use client';

import React, { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import useSWR, { mutate } from 'swr';
import {
  Clock,
  ChevronRight,
  Search,
  CheckCircle2,
  XCircle,
  Voicemail,
  Loader2,
  PhoneOff,
  RefreshCw,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { CallRecord, CallDisposition } from '@/lib/types';
import { fetcher } from '@/lib/fetcher';
import { CallDetailDrawer } from '@/components/history/CallDetailDrawer';

type TabFilter = 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'VOICEMAIL' | 'FAILED';

export const STATUS_META: Record<CallRecord['status'], { label: string; icon: React.ReactNode; className: string }> = {
  COMPLETED: {
    label: 'Completed',
    icon: <CheckCircle2 className="w-3 h-3" />,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
  },
  FAILED: {
    label: 'Failed',
    icon: <XCircle className="w-3 h-3" />,
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
  },
  VOICEMAIL: {
    label: 'Voicemail',
    icon: <Voicemail className="w-3 h-3" />,
    className: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  },
};

export const SENTIMENT_META: Record<string, { color: string }> = {
  POSITIVE: { color: 'text-emerald-600 dark:text-emerald-400' },
  NEUTRAL: { color: 'text-zinc-500 dark:text-zinc-400' },
  DEFENSIVE: { color: 'text-amber-600 dark:text-amber-400' },
  ANXIOUS: { color: 'text-orange-600 dark:text-orange-400' },
  ANGRY: { color: 'text-red-600 dark:text-red-400' },
};

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const subscribeNoop = () => () => {};
const returnTrue = () => true;
const returnFalse = () => false;
const EMPTY_CALLS: CallRecord[] = [];

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  } catch {
    return iso;
  }
}

export function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
  } catch {
    return '';
  }
}

export default function LogsPage() {
  const { data, isLoading, isValidating } = useSWR<{ calls: CallRecord[] }>('/api/calls', fetcher, {
    revalidateOnFocus: false,
  });

  const calls = data?.calls || EMPTY_CALLS;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [dispositionFilter, setDispositionFilter] = useState<string>('ALL');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  // SSR-safe mount detection
  const mounted = useSyncExternalStore(subscribeNoop, returnTrue, returnFalse);

  // Close side panel with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCall(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const counts = useMemo(() => {
    const res = {
      ALL: calls.length,
      COMPLETED: 0,
      IN_PROGRESS: 0,
      VOICEMAIL: 0,
      FAILED: 0,
    };
    for (const c of calls) {
      if (c.status in res) {
        res[c.status]++;
      }
    }
    return res;
  }, [calls]);

  const avgCompliance = useMemo(() => {
    if (calls.length === 0) return 100;
    const sum = calls.reduce((acc, c) => acc + (c.complianceScore || 0), 0);
    return Math.round(sum / calls.length);
  }, [calls]);

  const filtered = useMemo(() => {
    return calls.filter((call) => {
      if (activeTab !== 'ALL' && call.status !== activeTab) return false;
      if (dispositionFilter !== 'ALL' && call.disposition !== dispositionFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          call.debtorName.toLowerCase().includes(q) ||
          call.accountId.toLowerCase().includes(q) ||
          call.id.toLowerCase().includes(q) ||
          call.summary.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [calls, searchQuery, activeTab, dispositionFilter]);

  return (
    <div className="space-y-6 max-w-6xl pb-16">

      {/* Segmented Navigation Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-px overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Sessions', count: counts.ALL },
          { id: 'COMPLETED', label: 'Completed', count: counts.COMPLETED },
          { id: 'IN_PROGRESS', label: 'In Progress', count: counts.IN_PROGRESS },
          { id: 'VOICEMAIL', label: 'Voicemail', count: counts.VOICEMAIL },
          { id: 'FAILED', label: 'Failed', count: counts.FAILED },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabFilter)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white bg-zinc-50/50 dark:bg-zinc-900/50'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.id
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar & Disposition Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by debtor, account ID, call ID, or keywords..."
            aria-label="Search call logs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-colors placeholder:text-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="disposition-select"
            aria-label="Filter by call disposition"
            value={dispositionFilter}
            onChange={(e) => setDispositionFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-900 dark:focus:border-white cursor-pointer"
          >
            <option value="ALL">All Dispositions</option>
            <option value="PROMISE_TO_PAY">Promise to Pay</option>
            <option value="SETTLEMENT_OFFERED">Settlement Offered</option>
            <option value="PAYMENT_PLAN">Payment Plan</option>
            <option value="DISPUTE_RAISED">Dispute Raised</option>
            <option value="HARDSHIP">Hardship</option>
            <option value="CALL_BACK">Call Back</option>
            <option value="REFUSAL">Refusal</option>
            <option value="NO_ANSWER">No Answer</option>
            <option value="VOICEMAIL">Voicemail</option>
          </select>

          {(dispositionFilter !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setDispositionFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-2 py-1 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={() => mutate('/api/calls')}
            aria-label="Refresh call logs"
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Master Call Logs Table */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider font-bold bg-zinc-50/70 dark:bg-zinc-900/50">
              <tr>
                <th className="py-3 pl-5">Call ID</th>
                <th className="py-3">Debtor &amp; Account</th>
                <th className="py-3">Timestamp</th>
                <th className="py-3">Duration</th>
                <th className="py-3">Status</th>
                <th className="py-3">Disposition</th>
                <th className="py-3">Compliance</th>
                <th className="py-3">Sentiment</th>
                <th className="py-3 pr-5 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-24 text-center">
                    <Loader2 className="w-6 h-6 text-zinc-400 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-24 text-center">
                    <PhoneOff className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {calls.length === 0 ? 'No call sessions logged yet.' : 'No calls match the current filter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((call) => {
                  const isSelected = selectedCall?.id === call.id;
                  const statusMeta = STATUS_META[call.status] || STATUS_META.COMPLETED;
                  const sentimentMeta = SENTIMENT_META[call.sentiment] || SENTIMENT_META.NEUTRAL;

                  return (
                    <tr
                      key={call.id}
                      tabIndex={0}
                      role="button"
                      onClick={() => setSelectedCall(call)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedCall(call);
                        }
                      }}
                      className={`cursor-pointer transition-colors group ${
                        isSelected
                          ? 'bg-zinc-100/80 dark:bg-zinc-800/70'
                          : 'hover:bg-zinc-50/70 dark:hover:bg-zinc-850/40'
                      }`}
                    >
                      <td className="py-3 pl-5">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                          {call.id}
                        </span>
                      </td>

                      <td className="py-3">
                        <div className="font-semibold text-zinc-900 dark:text-white text-xs group-hover:underline">
                          {call.debtorName}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {call.accountId}
                        </div>
                      </td>

                      <td className="py-3">
                        <div className="font-medium text-zinc-800 dark:text-zinc-200 text-xs">
                          {formatDate(call.startTime)}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {formatTime(call.startTime)}
                        </div>
                      </td>

                      <td className="py-3 font-mono text-zinc-700 dark:text-zinc-300 text-xs">
                        {formatDuration(call.durationSeconds)}
                      </td>

                      <td className="py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${statusMeta.className}`}>
                          {statusMeta.icon}
                          {statusMeta.label}
                        </span>
                      </td>

                      <td className="py-3">
                        <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                          {call.disposition.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3">
                        <span className={`font-mono font-bold text-xs ${
                          call.complianceScore >= 90
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : call.complianceScore >= 70
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {call.complianceScore}%
                        </span>
                      </td>

                      <td className="py-3">
                        <span className={`font-semibold capitalize text-xs ${sentimentMeta.color}`}>
                          {call.sentiment.toLowerCase()}
                        </span>
                      </td>

                      <td className="py-3 text-right pr-5">
                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 ml-auto transition-colors" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over Side Panel for Call Detail & Transcript */}
      {mounted && selectedCall && createPortal(
        <CallDetailDrawer
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
        />,
        document.body
      )}
    </div>
  );
}
