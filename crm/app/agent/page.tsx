'use client';

import React, { useState, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import {
  Clock,
  ShieldCheck,
  Check,
  Loader2,
  AlertCircle,
  Building2,
  Volume2,
  Sliders,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { QueueSettings } from '@/lib/types';
import { fetcher } from '@/lib/fetcher';

const PRESET_INTERVALS = [
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '45m', value: 45 },
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
  { label: '4h', value: 240 },
  { label: '24h', value: 1440 },
];

const PRESET_ATTEMPTS = [1, 2, 3, 4, 5];

type TabId = 'all' | 'general' | 'cadence';

export default function AgentPage() {
  const [activeTab, setActiveTab] = useState<TabId>('all');

  // Queue Settings SWR
  const { data: settings, isLoading: isQueueLoading } = useSWR<QueueSettings>(
    '/api/settings',
    fetcher,
    { revalidateOnFocus: false }
  );

  // Form states
  const [companyName, setCompanyName] = useState<string>('Recovra');
  const [intervalMinutes, setIntervalMinutes] = useState<number>(60);
  const [maxAttempts, setMaxAttempts] = useState<number>(3);
  const [autoEnabled, setAutoEnabled] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const initialLoadedRef = useRef(false);
  const lastSavedRef = useRef<{
    companyName: string;
    intervalMinutes: number;
    maxAttempts: number;
    autoEnabled: boolean;
  } | null>(null);

  useEffect(() => {
    if (settings && !initialLoadedRef.current) {
      const initialCompany = settings.companyName || settings.brandName || 'Recovra';
      const initialInterval = settings.reattemptIntervalMinutes || 60;
      const initialAttempts = settings.maxReattempts || 3;
      const initialAuto = settings.autoReattemptEnabled ?? true;

      setCompanyName(initialCompany);
      setIntervalMinutes(initialInterval);
      setMaxAttempts(initialAttempts);
      setAutoEnabled(initialAuto);

      lastSavedRef.current = {
        companyName: initialCompany,
        intervalMinutes: initialInterval,
        maxAttempts: initialAttempts,
        autoEnabled: initialAuto,
      };
      initialLoadedRef.current = true;
    }
  }, [settings]);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Debounced auto-save effect
  useEffect(() => {
    if (!initialLoadedRef.current || !lastSavedRef.current) return;

    const currentData = {
      companyName: companyName.trim() || 'Recovra',
      intervalMinutes,
      maxAttempts,
      autoEnabled,
    };

    const hasChanged =
      currentData.companyName !== lastSavedRef.current.companyName ||
      currentData.intervalMinutes !== lastSavedRef.current.intervalMinutes ||
      currentData.maxAttempts !== lastSavedRef.current.maxAttempts ||
      currentData.autoEnabled !== lastSavedRef.current.autoEnabled;

    if (!hasChanged) return;

    setSaveStatus('saving');
    setSaveError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reattemptIntervalMinutes: currentData.intervalMinutes,
            maxReattempts: currentData.maxAttempts,
            autoReattemptEnabled: currentData.autoEnabled,
            companyName: currentData.companyName,
            brandName: currentData.companyName,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to update settings');
        }

        const updated = await res.json();
        lastSavedRef.current = currentData;
        mutate('/api/settings', updated, false);
        mutate('/api/queue');
        setSaveStatus('saved');
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
          setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
        }, 2500);
      } catch (err: any) {
        setSaveStatus('error');
        setSaveError(err.message || 'Auto-save failed');
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [companyName, intervalMinutes, maxAttempts, autoEnabled]);

  const formatIntervalDisplay = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        {[
          { id: 'all', label: 'All Controls' },
          { id: 'general', label: 'Brand & Voice Persona' },
          { id: 'cadence', label: 'Outreach Cadence' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabId)}
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

      {isQueueLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
        </div>
      ) : (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {/* Section 1: Brand & Voice Persona */}
          {(activeTab === 'all' || activeTab === 'general') && (
            <div className="py-8 first:pt-2 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-zinc-500" />
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Brand &amp; Voice Persona
                  </h2>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  The creditor organization name spoken by the AI voice agent when contacting debtors (&ldquo;I am calling from &#123;company&#125;&rdquo;).
                </p>
              </div>

              <div className="lg:col-span-8 space-y-4">
                <div className="space-y-1.5 max-w-lg">
                  <label
                    htmlFor="company-name-input"
                    className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    Creditor / Company Name
                  </label>
                  <input
                    id="company-name-input"
                    type="text"
                    maxLength={80}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Capital, Acme Financial, Recovra"
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-colors placeholder:text-zinc-400"
                  />
                </div>

                {/* Inline Voice Greeting Preview */}
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex items-start gap-3 max-w-xl">
                  <Volume2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                      Outbound Spoken Greeting Preview
                    </div>
                    <p className="font-mono text-zinc-700 dark:text-zinc-300 text-[11px] leading-relaxed">
                      &ldquo;Hello, this is Sarah calling from <span className="font-semibold text-zinc-950 dark:text-white underline decoration-zinc-300 underline-offset-2">{companyName.trim() || 'Recovra'}</span>. Am I speaking with [Debtor Name]?&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Reattempt Cadence */}
          {(activeTab === 'all' || activeTab === 'cadence') && (
            <div className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Outreach Cadence
                  </h2>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Pacing and retry policies enforced when debtor calls go unanswered or route directly to voicemail.
                </p>
              </div>

              <div className="lg:col-span-8 space-y-6">
                {/* Interval Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between max-w-lg">
                    <label htmlFor="custom-interval-input" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Minimum Interval Between Attempts
                    </label>
                    <span className="text-xs font-mono font-semibold text-zinc-900 dark:text-white">
                      {formatIntervalDisplay(intervalMinutes)}
                    </span>
                  </div>

                  {/* Segmented Control Bar */}
                  <div className="inline-flex flex-wrap p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 gap-1">
                    {PRESET_INTERVALS.map((preset) => {
                      const isSelected = intervalMinutes === preset.value;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setIntervalMinutes(preset.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white shadow-xs font-semibold'
                              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom minutes fallback */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-zinc-500">Or custom interval:</span>
                    <input
                      id="custom-interval-input"
                      type="number"
                      min={5}
                      max={10080}
                      value={intervalMinutes}
                      onChange={(e) => setIntervalMinutes(Math.max(5, parseInt(e.target.value, 10) || 5))}
                      aria-label="Custom retry interval in minutes"
                      className="w-20 px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors"
                    />
                    <span className="text-[11px] text-zinc-400">minutes</span>
                  </div>
                </div>

                {/* Maximum Attempts */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between max-w-lg">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Outreach Attempt Cap
                    </span>
                    <span className="text-xs font-mono font-semibold text-zinc-900 dark:text-white">
                      {maxAttempts} max tries
                    </span>
                  </div>

                  <div className="flex gap-2 max-w-md">
                    {PRESET_ATTEMPTS.map((count) => {
                      const isSelected = maxAttempts === count;
                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setMaxAttempts(count)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors text-center cursor-pointer ${
                            isSelected
                              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-950 dark:border-white shadow-xs'
                              : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                          }`}
                        >
                          {count}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                    <span>FDCPA / TCPA standard: 3 attempts within a rolling 7-day window.</span>
                  </div>
                </div>

                {/* Autonomous Queue Toggle */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between max-w-lg">
                  <div className="space-y-0.5">
                    <label htmlFor="autonomous-queue-toggle" className="text-xs font-semibold text-zinc-900 dark:text-white block cursor-pointer">
                      Autonomous Reattempt Placement
                    </label>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Automatically schedule unanswered calls into the recovery backlog.
                    </p>
                  </div>
                  <button
                    id="autonomous-queue-toggle"
                    type="button"
                    role="switch"
                    aria-checked={autoEnabled}
                    onClick={() => setAutoEnabled(!autoEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400 ${
                      autoEnabled ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-zinc-950 transition-transform ${
                        autoEnabled ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message if Auto-Save Fails */}
          {saveStatus === 'error' && saveError && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 text-xs font-semibold flex items-center gap-2 mt-4">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              {saveError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
