'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { useSession, authClient } from '@/lib/auth-client';
import { fetcher } from '@/lib/fetcher';
import { CallRecord } from '@/lib/types';
import {
  User,
  ShieldCheck,
  CreditCard,
  Check,
  Loader2,
  Clock,
  Zap,
  Lock,
  AlertCircle,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

type SettingsTab = 'all' | 'billing' | 'account';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>('all');

  // Fetch real calls from database
  const { data: callsData, isLoading: isCallsLoading } = useSWR<{ calls: CallRecord[] }>(
    '/api/calls',
    fetcher,
    { revalidateOnFocus: false }
  );

  const calls = useMemo(() => callsData?.calls || [], [callsData]);

  // Compute 100% real live voice telephony metrics
  const RATE_PER_MINUTE = 0.12; // $0.12 / minute
  const totalCalls = calls.length;
  const completedCalls = calls.filter((c) => c.status === 'COMPLETED').length;
  const totalDurationSeconds = calls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);
  const totalExactMinutes = (totalDurationSeconds / 60).toFixed(1);
  const billableMinutes = Math.ceil(totalDurationSeconds / 60);
  const totalAccruedSpend = (billableMinutes * RATE_PER_MINUTE).toFixed(2);
  const avgDurationSeconds = totalCalls > 0 ? Math.round(totalDurationSeconds / totalCalls) : 0;

  // Real sub-component cost breakdown based strictly on actual billable minutes
  const telephonyCost = (billableMinutes * 0.035).toFixed(2);
  const transcriptionCost = (billableMinutes * 0.025).toFixed(2);
  const reasoningCost = (billableMinutes * 0.02).toFixed(2);
  const voiceSynthesisCost = (billableMinutes * 0.04).toFixed(2);

  // User Account form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordStatus('error');
      setPasswordMessage('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus('error');
      setPasswordMessage('New password and confirmation do not match.');
      return;
    }

    setPasswordStatus('saving');
    setPasswordMessage(null);

    try {
      const res = await authClient.changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: true,
      });

      if (res?.error) {
        throw new Error(res.error.message || 'Failed to update password');
      }

      setPasswordStatus('saved');
      setPasswordMessage('Account password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordStatus('idle'), 3500);
    } catch (err: any) {
      setPasswordStatus('error');
      setPasswordMessage(err.message || 'Current password incorrect or update failed.');
    }
  };

  const formatDurationDisplay = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatDateDisplay = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Billing &amp; Account Controls
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time voice telephony minutes, metered cost tracking, and operator account security.
          </p>
        </div>

        {/* Direct Link to Agent Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            href="/agent"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Agent Controls</span>
          </Link>
          <Link
            href="/agent/prompt"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prompt Editor</span>
          </Link>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        {[
          { id: 'all', label: 'All Settings' },
          { id: 'billing', label: 'Billing Per Minutes' },
          { id: 'account', label: 'User Account Control' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as SettingsTab)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white bg-zinc-50/50 dark:bg-zinc-900/50'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {/* SECTION 1: BILLING PER MINUTES (ACTUAL DATABASE METRICS) */}
        {(activeTab === 'all' || activeTab === 'billing') && (
          <div className="py-8 first:pt-2 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-zinc-500" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Billing Per Minutes
                </h2>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Pay-as-you-go metered billing calculated directly from actual outbound debtor call durations.
              </p>
            </div>

            <div className="lg:col-span-8 space-y-6 max-w-xl">
              {/* Telephony Usage Dashboard Card */}
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                      Actual Call Duration
                    </span>
                    <div className="text-lg font-bold text-zinc-900 dark:text-white">
                      {isCallsLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                      ) : (
                        <>
                          {totalExactMinutes} <span className="text-xs font-normal text-zinc-500">minutes recorded</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                      Standard Rate
                    </span>
                    <div className="text-sm font-mono font-bold text-zinc-900 dark:text-white">
                      ${RATE_PER_MINUTE.toFixed(2)} <span className="text-[11px] text-zinc-500">/ min</span>
                    </div>
                  </div>
                </div>

                {/* Metrics Summary Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Accrued Usage</span>
                    <div className="text-xs font-mono font-bold text-zinc-900 dark:text-white mt-0.5">
                      ${totalAccruedSpend}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Recorded Calls</span>
                    <div className="text-xs font-mono font-bold text-zinc-900 dark:text-white mt-0.5">
                      {totalCalls} calls ({completedCalls} completed)
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Average Call</span>
                    <div className="text-xs font-mono font-bold text-zinc-900 dark:text-white mt-0.5">
                      {formatDurationDisplay(avgDurationSeconds)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Real Rate Cost Breakdown based on actual usage */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Cost Breakdown ({billableMinutes} billable minutes)
                </div>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                      <Radio className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Telephony SIP Trunking &amp; Audio Channels ($0.035/min)</span>
                    </div>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-white">${telephonyCost}</span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                      <Zap className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Speech-to-Text Transcription ($0.025/min)</span>
                    </div>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-white">${transcriptionCost}</span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Conversational Reasoning Engine ($0.020/min)</span>
                    </div>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-white">${reasoningCost}</span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                      <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Neural Voice Synthesis ($0.040/min)</span>
                    </div>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-white">${voiceSynthesisCost}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SECTION 2: USER ACCOUNT CONTROL (AUTHENTICATED SESSION) */}
        {(activeTab === 'all' || activeTab === 'account') && (
          <div className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-500" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  User Account Control
                </h2>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Live authenticated operator session, portfolio credentials, and password security.
              </p>
            </div>

            <div className="lg:col-span-8 space-y-6 max-w-xl">
              {/* Profile Details Card */}
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                      Account Name
                    </span>
                    <div className="text-xs font-semibold text-zinc-900 dark:text-white">
                      {session?.user?.name || 'Recovery Officer'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                      Verified Email
                    </span>
                    <div className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                      {session?.user?.email || '—'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                      User Identifier
                    </span>
                    <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">
                      {session?.user?.id || '—'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                      Account Created
                    </span>
                    <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {session?.user?.createdAt
                        ? formatDateDisplay(String(session.user.createdAt))
                        : 'Active'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Change Form */}
              <form
                onSubmit={handlePasswordUpdate}
                className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    Update Account Password
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="current-pass-input" className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Current Password
                    </label>
                    <input
                      id="current-pass-input"
                      type="password"
                      placeholder="••••••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="new-pass-input" className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        New Password
                      </label>
                      <input
                        id="new-pass-input"
                        type="password"
                        placeholder="At least 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="confirm-pass-input" className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        Confirm New Password
                      </label>
                      <input
                        id="confirm-pass-input"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {passwordStatus === 'error' && passwordMessage && (
                  <div className="p-2.5 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{passwordMessage}</span>
                  </div>
                )}
                {passwordStatus === 'saved' && passwordMessage && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{passwordMessage}</span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={passwordStatus === 'saving' || !newPassword || !currentPassword}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    {passwordStatus === 'saving' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Real Active Security Session Card */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                      Live Authenticated Session
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                    Active
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  Signed in as <span className="font-semibold text-zinc-900 dark:text-white">{session?.user?.email || 'User'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
