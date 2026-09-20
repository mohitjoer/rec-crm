'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Activity, ShieldCheck, PhoneCall } from 'lucide-react';

const SCENARIOS = {
  ptp: {
    label: 'Promise to Pay (PTP)',
    description: 'Borrower agrees to pay on their next direct deposit date.',
    outcome: 'Ledger: $300.00 Scheduled PTP Logged',
    disposition: 'PTP_COMMITTED',
    messages: [
      {
        id: '1',
        speaker: 'agent',
        text: 'Hello, this is Sarah with account services regarding your outstanding balance of $1,450.00. How can we work together to bring this account current today?',
      },
      {
        id: '2',
        speaker: 'borrower',
        text: 'I cannot clear the whole amount right now, but I can pay $300 this Friday when my direct deposit clears.',
      },
      {
        id: '3',
        speaker: 'agent',
        text: 'Understood. I have recorded a $300.00 Promise to Pay for this Friday. A secure SMS confirmation link has been sent to your mobile phone.',
      },
    ],
  },
  discount: {
    label: 'Settlement Discount',
    description: 'Borrower requests a lump-sum payoff discount within CFO-approved bounds.',
    outcome: 'Ledger: $1,160.00 (-20% Settled Payoff Authorized)',
    disposition: 'SETTLEMENT_AUTHORIZED',
    messages: [
      {
        id: '4',
        speaker: 'borrower',
        text: 'Is there any discount available if I pay off the entire balance in full today?',
      },
      {
        id: '5',
        speaker: 'agent',
        text: 'Under our same-day payoff policy, I can authorize a 20% settlement discount, reducing your total balance from $1,450.00 to $1,160.00.',
      },
      {
        id: '6',
        speaker: 'borrower',
        text: 'That works for me. Please text me the secure payment link.',
      },
      {
        id: '7',
        speaker: 'agent',
        text: 'The payment link has been dispatched via SMS. Once processed, your account will be marked as settled in full.',
      },
    ],
  },
  hardship: {
    label: 'Hardship Hold',
    description: 'Borrower states an emergency; agent empathy activates temporary hold.',
    outcome: 'Ledger: 30-Day Hardship Hold Placed & Compliance Flagged',
    disposition: 'HARDSHIP_SUSPENDED',
    messages: [
      {
        id: '8',
        speaker: 'borrower',
        text: 'I recently had a medical emergency and have zero income this month.',
      },
      {
        id: '9',
        speaker: 'agent',
        text: 'I understand, and I appreciate you letting us know. I have placed an immediate 30-day hardship hold on your account to pause follow-ups while your case is reviewed.',
      },
    ],
  },
  dispute: {
    label: 'Debt Verification',
    description: 'Borrower questions debt validity; FDCPA validation process triggered.',
    outcome: 'Ledger: Verification Dispatched & Outreach Paused',
    disposition: 'DISPUTE_VERIFICATION_PENDING',
    messages: [
      {
        id: '10',
        speaker: 'borrower',
        text: 'I do not recognize this charge and want written verification of this debt.',
      },
      {
        id: '11',
        speaker: 'agent',
        text: 'Under FDCPA guidelines, you have the right to debt verification. I have flagged your account, paused outreach, and dispatched formal verification documentation to your address on file.',
      },
    ],
  },
} as const;

type Key = keyof typeof SCENARIOS;

export function VoiceDemoSimulator() {
  const [active, setActive] = useState<Key>('ptp');
  const current = SCENARIOS[active];

  return (
    <section id="simulator" className="py-24 px-6 md:px-12 bg-zinc-50 dark:bg-[#0c0c0e] border-t border-zinc-200 dark:border-zinc-800/80">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-mono">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Interactive Voice Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            Inspect autonomous negotiations in real time.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Select a scenario below to test how Recovra’s conversational state engine navigates different collection scenarios while maintaining compliance.
          </p>
        </div>

        {/* Scenario Selection Tabs */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SCENARIOS) as Key[]).map((k) => (
            <button
              key={k}
              onClick={() => setActive(k)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                active === k
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs'
                  : 'bg-white dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {SCENARIOS[k].label}
            </button>
          ))}
        </div>

        {/* Interactive Dialogue Card */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 overflow-hidden shadow-sm">
          {/* Header Bar */}
          <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-950/80 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>SIMULATED VOICE SESSION &bull; {current.label.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-[11px]">
              <Activity className="w-3.5 h-3.5 text-zinc-500" />
              <span>240ms Turn Latency</span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="p-6 space-y-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono italic pb-2 border-b border-zinc-100 dark:border-zinc-800/50">
              {current.description}
            </p>

            {current.messages.map((m) => {
              const isAgent = m.speaker === 'agent';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} space-y-1`}
                >
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide">
                    {isAgent ? 'Recovra Voice Agent' : 'Account Holder (Borrower)'}
                  </span>
                  <div
                    className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                      isAgent
                        ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-tl-xs'
                        : 'bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-850 rounded-tr-xs shadow-xs'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Outcome Footer */}
          <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">{current.outcome}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {current.disposition}
              </span>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white text-xs transition-colors ml-2"
              >
                <span>Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
