'use client';

import React from 'react';
import { XCircle, CheckCircle2, Split } from 'lucide-react';

const BEFORE_POINTS = [
  'Legacy collection agencies charge 25% to 35% contingency commissions on recovered debt',
  'Manual phone calls with 3–5 day lag times and inconsistent human follow-ups',
  'Human operator fatigue leads to forgotten Mini-Miranda disclosures and regulatory risk',
  'Siloed spreadsheets and static monthly PDF reports with zero real-time visibility',
];

const AFTER_POINTS = [
  'Zero contingency fees — keep 100% of recovered cash on a predictable SaaS model',
  'Instant outreach within 60 seconds of account delinquency with sub-250ms voice turns',
  '100% statutory FDCPA and TCPA compliance hardcoded into the conversational state machine',
  'Real-time operations console with streaming live transcripts and instant ledger sync',
];

export function WhatChanges() {
  return (
    <section id="comparison" className="py-24 px-6 md:px-12 bg-white dark:bg-[#09090b] border-t border-zinc-200 dark:border-zinc-800/80">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            <Split className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
            <span>Operational Contrast</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-tight">
            How Recovra compares to legacy manual collection agencies.
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Replace opaque 30% commission agencies and disconnected spreadsheets with an automated, compliant recovery software platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Legacy Agency Model */}
          <div className="p-7 md:p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                Legacy Collection Agency
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                High contingency commissions, delayed follow-ups, and customer friction.
              </p>
            </div>
            <ul className="space-y-3.5 pt-2">
              {BEFORE_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <XCircle className="w-4 h-4 text-zinc-400 dark:text-zinc-600 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recovra Model */}
          <div className="p-7 md:p-8 rounded-3xl bg-white dark:bg-zinc-900/70 border-2 border-zinc-900 dark:border-zinc-100 space-y-5 shadow-lg">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Recovra Autonomous Platform
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Fixed SaaS pricing, instant conversational engagement, and 100% compliance.
              </p>
            </div>
            <ul className="space-y-3.5 pt-2">
              {AFTER_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-xs text-zinc-800 dark:text-zinc-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-white shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
