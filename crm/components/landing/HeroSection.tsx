'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface HeroSectionProps {
  onOpenDemoModal?: () => void;
}

const PLATFORM_PILLARS = [
  { label: 'Sub-250ms Voice Latency', icon: Zap },
  { label: 'FDCPA & TCPA Guardrails', icon: ShieldCheck },
  { label: 'Autonomous Settlement Rails', icon: Activity },
  { label: 'Fixed SaaS Model — 0% Contingency', icon: Lock },
];

export function HeroSection({ onOpenDemoModal }: HeroSectionProps) {
  return (
    <section className="pt-20 pb-20 px-6 md:px-12 max-w-7xl mx-auto space-y-16">
      {/* Hero Header & Value Proposition */}
      <div className="max-w-4xl mx-auto text-center space-y-7">
        {/* Status Announcement Badge */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 shadow-xs transition-colors">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-zinc-900 dark:text-white">Recovra Voice Engine</span>
          <span className="text-zinc-400">&bull;</span>
          <span>Collections that run themselves</span>
        </div>

        {/* Main Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.06]">
            Collections that run themselves.
          </h1>
          <p className="text-base sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Conversational voice agents that negotiate overdue balances, structure compliant payment plans within your CFO-approved rules, and sync directly with your ledger.
          </p>
        </div>

        {/* Primary Call-to-Action Group */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            variant="default"
            onClick={onOpenDemoModal}
            className="w-full sm:w-auto h-12 px-7 rounded-full font-bold text-xs tracking-tight shadow-sm cursor-pointer gap-2"
          >
            <span>Book a Product Demo</span>
            <ArrowUpRight className="w-4 h-4" />
          </Button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-100 text-xs font-semibold h-12 px-7 rounded-full border border-zinc-200 dark:border-zinc-800 transition-colors shadow-xs"
          >
            <span>Explore Live Console</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
          </Link>
        </div>

        {/* Genuine Platform Capabilities */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          {PLATFORM_PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="inline-flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-200" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero Visual: Platform Operations Console Preview */}
      <div className="max-w-5xl mx-auto">
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#0c0c0e]/90 shadow-2xl shadow-zinc-900/10 dark:shadow-black/60 overflow-hidden backdrop-blur-xl">
          {/* Mockup Window Title Bar */}
          <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]/90 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]/90 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-[#27c93f]/90 inline-block"></span>
              <span className="ml-2 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                recovra.app/operations/console
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono border border-zinc-200 dark:border-zinc-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>VOICE AGENT &bull; SIMULATION RUNTIME</span>
              </div>
            </div>
          </div>

          {/* Interior Split Application Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
            {/* Left Column: Conversational Negotiation Demo */}
            <div className="lg:col-span-7 p-6 sm:p-7 space-y-6">
              {/* Context Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                <div>
                  <div className="text-xs font-mono font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <span>Negotiation Workflow Demonstration</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    Scenario: Split-Installment Agreement &bull; 45 DPD Past-Due Account
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
                    Live Demo Mode
                  </span>
                </div>
              </div>

              {/* Dynamic Audio Visualizer */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                    Bidirectional Audio Stream
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                    240ms Turnaround &bull; Human Conversational Pacing
                  </span>
                </div>

                {/* Pulsing Audio Waves */}
                <div className="flex items-end justify-center gap-1.5 h-10 py-1 bg-white dark:bg-zinc-900/60 rounded-xl px-4 border border-zinc-200/60 dark:border-zinc-800/60">
                  {[35, 60, 90, 50, 80, 25, 95, 100, 65, 40, 75, 55, 30, 85, 45, 70, 35].map(
                    (h, i) => (
                      <div
                        key={i}
                        style={{ height: `${h}%` }}
                        className="w-1 bg-zinc-800 dark:bg-zinc-200 rounded-full audio-bar"
                      />
                    )
                  )}
                </div>
              </div>

              {/* Real-time Dialogue Stream */}
              <div className="space-y-3 font-sans text-xs">
                {/* Agent Turn 1: Mini Miranda */}
                <div className="flex flex-col items-start space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    Recovra Agent Sarah (Disclosing)
                  </span>
                  <div className="p-3.5 rounded-2xl rounded-tl-sm bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 leading-relaxed max-w-[92%]">
                    &ldquo;Hello, this is Sarah regarding your account. This call is an attempt to resolve an outstanding balance. Can we discuss options to bring this current today?&rdquo;
                  </div>
                </div>

                {/* Debtor Turn */}
                <div className="flex flex-col items-end space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    Account Holder
                  </span>
                  <div className="p-3.5 rounded-2xl rounded-tr-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-300 leading-relaxed max-w-[92%] shadow-xs">
                    &ldquo;I cannot pay the entire balance today, but I could do two split installments if late fees are stopped.&rdquo;
                  </div>
                </div>

                {/* Agent Turn 2 with Structured Plan */}
                <div className="flex flex-col items-start space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    Recovra Agent Sarah (Structuring Plan)
                  </span>
                  <div className="p-3.5 rounded-2xl rounded-tl-sm bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 leading-relaxed max-w-[92%]">
                    &ldquo;Under our payment policy, I can approve a two-installment schedule: 50% scheduled for this Friday and 50% on the 1st of next month, waiving subsequent late penalties. A secure confirmation SMS has been dispatched.&rdquo;
                  </div>
                </div>
              </div>

              {/* Outcome Status Banner */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Commitment Recorded: Two-Part Payment Arrangement</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                  Ledger Updated
                </span>
              </div>
            </div>

            {/* Right Column: Architectural Guardrails & System Rules */}
            <div className="lg:col-span-5 p-6 sm:p-7 space-y-6 bg-zinc-50/50 dark:bg-zinc-950/40">
              <div className="space-y-1 pb-4 border-b border-zinc-200 dark:border-zinc-800/60">
                <h4 className="font-mono text-xs uppercase text-zinc-500 dark:text-zinc-400 font-semibold tracking-wider">
                  Active Guardrails &amp; Controls
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Real-time rule engine governing every call session
                </p>
              </div>

              {/* System Configuration Status */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-xs">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block">
                    Statutory Compliance
                  </span>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>FDCPA Mini-Miranda Automated</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Mandatory identification and purpose delivered before balance discussion
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-xs">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block">
                    TCPA Calling Hours
                  </span>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>8:00 AM – 9:00 PM Local Time</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Dialing windows strictly mapped to debtor area code and jurisdiction
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-xs">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block">
                    Settlement Authority
                  </span>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                    <span>CFO-Configured Parameter Bounds</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Agents cannot authorize discounts beyond pre-set management thresholds
                  </p>
                </div>
              </div>

              {/* Console Link */}
              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-white py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors"
                >
                  <span>Open Operations Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
