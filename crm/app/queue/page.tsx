'use client';

import React, { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import {
  Clock,
  PhoneCall,
  Search,
  CheckCircle2,
  Loader2,
  Settings,
  RefreshCw,
  PhoneOff,
  ChevronRight,
  X,
  ShieldCheck,
  Calendar,
  DollarSign,
  Voicemail,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { QueuedCall, QueueSettings, QueuedCallStatus } from '@/lib/types';
import { fetcher } from '@/lib/fetcher';

interface QueueApiResponse {
  settings: QueueSettings;
  queuedCalls: QueuedCall[];
}

type TabFilter = 'ALL' | 'DUE' | 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXHAUSTED';

const QUEUE_STATUS_META: Record<
  QueuedCallStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  DUE: {
    label: 'Due for Reattempt',
    icon: <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />,
    className:
      'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  QUEUED: {
    label: 'Scheduled',
    icon: <Clock className="w-3 h-3" />,
    className:
      'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  },
  IN_PROGRESS: {
    label: 'Dialing...',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
  },
  COMPLETED: {
    label: 'Resolved',
    icon: <CheckCircle2 className="w-3 h-3" />,
    className:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />,
    className:
      'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
  },
  EXHAUSTED: {
    label: 'Max Retries Reached',
    icon: <PhoneOff className="w-3 h-3" />,
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
  },
};

function formatRelativeTime(isoString: string): string {
  try {
    const target = new Date(isoString).getTime();
    const diffMs = target - Date.now();
    const diffMins = Math.round(diffMs / (60 * 1000));

    if (diffMins <= 0) return 'Due now';
    if (diffMins < 60) return `in ${diffMins}m`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `in ${diffHours}h`;
    const diffDays = Math.round(diffHours / 24);
    return `in ${diffDays}d`;
  } catch {
    return isoString;
  }
}

const subscribeNoop = () => () => {};
const returnTrue = () => true;
const returnFalse = () => false;
const EMPTY_QUEUED_CALLS: QueuedCall[] = [];

// react-doctor-disable-next-line react-doctor/no-locale-format-in-render
function formatDateOnly(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

// react-doctor-disable-next-line react-doctor/no-locale-format-in-render
function formatTimeOnly(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}

function QueueTableHeader() {
  return (
    <thead className="text-[10px] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider font-bold bg-zinc-50/70 dark:bg-zinc-900/50">
      <tr>
        <th className="py-3 pl-5">Queue ID</th>
        <th className="py-3">Debtor &amp; Account</th>
        <th className="py-3">Phone</th>
        <th className="py-3">Overdue Balance</th>
        <th className="py-3">Queue Status</th>
        <th className="py-3">Attempt Progress</th>
        <th className="py-3">Next Attempt</th>
        <th className="py-3 text-right pr-5">Actions</th>
      </tr>
    </thead>
  );
}

export default function QueuedCallsPage() {
  const { data, isLoading, isValidating } = useSWR<QueueApiResponse>('/api/queue', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  });

  const queuedCalls = data?.queuedCalls || EMPTY_QUEUED_CALLS;
  const settings = data?.settings;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [selectedCall, setSelectedCall] = useState<QueuedCall | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const mounted = useSyncExternalStore(subscribeNoop, returnTrue, returnFalse);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  // Close side panel on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCall(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const counts = useMemo(() => {
    const res = {
      ALL: queuedCalls.length,
      DUE: 0,
      QUEUED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      EXHAUSTED: 0,
    };
    for (const c of queuedCalls) {
      const isDue =
        c.status === 'DUE' ||
        (c.status === 'QUEUED' && now > 0 && new Date(c.nextAttemptAt).getTime() <= now);
      if (isDue) res.DUE++;
      else if (c.status === 'QUEUED') res.QUEUED++;
      else if (c.status === 'IN_PROGRESS') res.IN_PROGRESS++;
      else if (c.status === 'COMPLETED') res.COMPLETED++;
      else if (c.status === 'EXHAUSTED' || c.status === 'CANCELLED') res.EXHAUSTED++;
    }
    return res;
  }, [queuedCalls, now]);

  const filteredCalls = useMemo(() => {
    return queuedCalls.filter((call) => {
      const isDue =
        call.status === 'DUE' ||
        (call.status === 'QUEUED' && now > 0 && new Date(call.nextAttemptAt).getTime() <= now);

      if (activeTab === 'DUE' && !isDue) return false;
      if (activeTab === 'QUEUED' && (isDue || call.status !== 'QUEUED')) return false;
      if (activeTab === 'IN_PROGRESS' && call.status !== 'IN_PROGRESS') return false;
      if (activeTab === 'COMPLETED' && call.status !== 'COMPLETED') return false;
      if (activeTab === 'EXHAUSTED' && call.status !== 'EXHAUSTED' && call.status !== 'CANCELLED') return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          call.debtorName.toLowerCase().includes(q) ||
          call.phoneNumber.toLowerCase().includes(q) ||
          call.accountId.toLowerCase().includes(q) ||
          call.originalCreditor.toLowerCase().includes(q) ||
          call.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [queuedCalls, searchQuery, activeTab, now]);

  const handleReattemptNow = async (call: QueuedCall, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActionLoadingId(call.id);
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reattempt_now', id: call.id }),
      });

      if (!res.ok) throw new Error('Failed to initiate reattempt');

      await fetch('/api/calls/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: call.accountId,
          phoneNumber: call.phoneNumber,
        }),
      }).catch(() => {});

      setSuccessMessage(`Reattempt initiated for ${call.debtorName}.`);
      mutate('/api/queue');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Could not reattempt call');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelCall = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', id }),
      });
      if (res.ok) {
        mutate('/api/queue');
        if (selectedCall?.id === id) {
          setSelectedCall(null);
        }
      }
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Navigation Filter Tabs matching Settings style */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-px overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Backlog', count: counts.ALL },
          { id: 'DUE', label: 'Due for Reattempt', count: counts.DUE },
          { id: 'QUEUED', label: 'Scheduled', count: counts.QUEUED },
          { id: 'IN_PROGRESS', label: 'Dialing', count: counts.IN_PROGRESS },
          { id: 'COMPLETED', label: 'Resolved', count: counts.COMPLETED },
          { id: 'EXHAUSTED', label: 'Exhausted', count: counts.EXHAUSTED },
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

      {/* Search Input Bar & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Filter by debtor name, phone, creditor, or account ID..."
            aria-label="Filter queued calls"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-colors placeholder:text-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/agent"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Cadence: {settings?.reattemptIntervalMinutes || 60}m gap</span>
          </Link>

          <button
            type="button"
            onClick={() => mutate('/api/queue')}
            aria-label="Refresh recovery queue"
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Master Queue Table */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <QueueTableHeader />
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <Loader2 className="w-6 h-6 text-zinc-400 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <PhoneOff className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {queuedCalls.length === 0
                        ? 'No queued calls pending reattempt.'
                        : 'No queued calls match the current filter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCalls.map((call) => {
                  const isSelected = selectedCall?.id === call.id;
                  const isDue =
                    call.status === 'DUE' ||
                    (call.status === 'QUEUED' && now > 0 && new Date(call.nextAttemptAt).getTime() <= now);
                  const statusKey: QueuedCallStatus = isDue && call.status === 'QUEUED' ? 'DUE' : call.status;
                  const statusMeta = QUEUE_STATUS_META[statusKey] || QUEUE_STATUS_META.QUEUED;
                  const isActing = actionLoadingId === call.id;
                  const progressPct = Math.min(
                    100,
                    Math.round((call.attemptCount / (call.maxAttempts || 3)) * 100)
                  );

                  return (
                    <tr
                      key={call.id}
                      tabIndex={0}
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

                      <td className="py-3 font-mono text-zinc-700 dark:text-zinc-300 text-xs">
                        {call.phoneNumber}
                      </td>

                      <td className="py-3">
                        <div className="font-semibold text-zinc-900 dark:text-white text-xs">
                          ${call.currentBalance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate max-w-[120px]">
                          {call.originalCreditor}
                        </div>
                      </td>

                      <td className="py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${statusMeta.className}`}
                        >
                          {statusMeta.icon}
                          {statusMeta.label}
                        </span>
                      </td>

                      <td className="py-3">
                        <div className="space-y-1 w-24">
                          <div className="text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-300">
                            {call.attemptCount} / {call.maxAttempts || 3} tries
                          </div>
                          <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-zinc-900 dark:bg-white rounded-full transition-[width] duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3">
                        <div className="font-mono text-zinc-800 dark:text-zinc-200 text-xs">
                          {formatRelativeTime(call.nextAttemptAt)}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {formatTimeOnly(call.nextAttemptAt)}
                        </div>
                      </td>

                      <td className="py-3 text-right pr-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={(e) => handleReattemptNow(call, e)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {isActing ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <PhoneCall className="w-3 h-3" />
                            )}
                            <span>Reattempt</span>
                          </button>
                          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Panel Drawer for Queued Call Inspection */}
      {mounted &&
        selectedCall &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex justify-end m-0 p-0">
              <button
                type="button"
                onClick={() => setSelectedCall(null)}
                aria-label="Close drawer backdrop"
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-default w-full h-full border-none p-0"
              />

              <div
                role="dialog"
                aria-modal="true"
                aria-label={`Queue Details - ${selectedCall.debtorName}`}
                className="fixed inset-y-0 right-0 left-auto m-0 ml-auto z-[101] w-full max-w-xl md:max-w-2xl bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full max-h-screen overflow-hidden animate-in slide-in-from-right duration-200"
              >
                {/* Drawer Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
                        {selectedCall.id}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                          (QUEUE_STATUS_META[selectedCall.status] || QUEUE_STATUS_META.QUEUED).className
                        }`}
                      >
                        {(QUEUE_STATUS_META[selectedCall.status] || QUEUE_STATUS_META.QUEUED).icon}
                        {(QUEUE_STATUS_META[selectedCall.status] || QUEUE_STATUS_META.QUEUED).label}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white truncate">
                      {selectedCall.debtorName}
                    </h2>
                  </div>

                  <button
                    onClick={() => setSelectedCall(null)}
                    aria-label="Close panel"
                    className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Inline Metadata Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Phone</span>
                      <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                        {selectedCall.phoneNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Account</span>
                      <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                        {selectedCall.accountId}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Balance</span>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        ${selectedCall.currentBalance.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Creditor</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate block">
                        {selectedCall.originalCreditor}
                      </span>
                    </div>
                  </div>

                  {/* Retry Schedule & Progress */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Retry Cadence &amp; Policy
                    </h3>
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Reattempt Gap:</span>
                        <span className="font-bold text-zinc-900 dark:text-white">
                          {settings?.reattemptIntervalMinutes || 60} minutes
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Next Reattempt At:</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-white">
                          {formatDateOnly(selectedCall.nextAttemptAt)} at{' '}
                          {formatTimeOnly(selectedCall.nextAttemptAt)} (
                          {formatRelativeTime(selectedCall.nextAttemptAt)})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Retry Attempts:</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-white">
                          {selectedCall.attemptCount} of {selectedCall.maxAttempts || 3} max allowed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Notes */}
                  {selectedCall.notes && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Dispatch Notes
                      </h3>
                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-mono">
                        {selectedCall.notes}
                      </div>
                    </div>
                  )}
                </div>

                {/* Drawer Footer Actions */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleCancelCall(selectedCall.id, e)}
                    disabled={actionLoadingId === selectedCall.id}
                    className="px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel Reattempts
                  </button>

                  {(selectedCall.status === 'DUE' || selectedCall.status === 'QUEUED') && (
                    <button
                      type="button"
                      disabled={actionLoadingId === selectedCall.id}
                      onClick={(e) => handleReattemptNow(selectedCall, e)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {actionLoadingId === selectedCall.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <PhoneCall className="w-3.5 h-3.5" />
                      )}
                      <span>Reattempt Now</span>
                    </button>
                  )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
