'use client';

import React from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  ShieldCheck,
  CreditCard,
  SlidersHorizontal,
  Activity,
  ArrowRight,
  Sparkles,
  Lock,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export function FeatureBento() {
  return (
    <section id="platform" className="py-24 px-6 md:px-12 bg-white dark:bg-[#09090b] border-t border-zinc-200 dark:border-zinc-800/80">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
            <span>Enterprise Platform Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-white leading-[1.12]">
            Engineered for high resolution and zero compliance risk.
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Every layer of Recovra is built specifically for debt recovery — combining low-latency conversational audio, dynamic negotiation intelligence, and strict regulatory enforcement.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card 1: Conversational Voice Engine (Large 8 cols) */}
          <div className="md:col-span-8 p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 space-y-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="space-y-3 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono uppercase text-zinc-500 dark:text-zinc-400 font-semibold">
                  Conversational Audio Runtime
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Sub-250ms latency with empathetic conversational pacing.
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
                Traditional IVRs sound robotic and get hung up on within 4 seconds. Recovra’s bidirectional audio engine understands cadence, tone changes, and interjections naturally without awkward delays.
              </p>
            </div>

            {/* Audio Waveform Simulation Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm z-10">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold">
                    ACTIVE CALL #4092 &bull; 02:14
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">240ms Turnaround</span>
              </div>

              {/* Pulsing Audio Waves */}
              <div className="flex items-end justify-center gap-1.5 h-12 py-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl px-4 border border-zinc-200/60 dark:border-zinc-800/60">
                {[40, 75, 95, 60, 85, 30, 90, 100, 70, 45, 80, 65, 35, 90, 50, 75, 40].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-1.5 bg-zinc-800 dark:bg-zinc-200 rounded-full transition-[height] duration-300 audio-bar"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                <span>Speaker: Agent Sarah</span>
                <span>Sentiment: Cooperative (0.89)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Autonomous Settlement Bounds (Small 4 cols) */}
          <div className="md:col-span-4 p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                CFO-Approved Settlement Rails
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Set strict floor limits on authorized discounts (e.g. max 15% discount for lump-sum payoffs, or 3-month split installments). The agent never overpromises.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs font-mono shadow-sm">
              <div className="flex justify-between text-zinc-500">
                <span>Principal Owed</span>
                <span className="text-zinc-900 dark:text-white font-bold">$1,450.00</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>CFO Floor Rule</span>
                <span className="text-zinc-900 dark:text-white font-bold">Max -20%</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                <span>Authorized Offer</span>
                <span className="font-bold">$1,160.00</span>
              </div>
            </div>
          </div>

          {/* Card 3: Algorithmic Compliance Fortress (4 cols) */}
          <div className="md:col-span-4 p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                FDCPA &amp; TCPA Guardrails
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Automates mandatory Mini-Miranda disclosures, validates debtor identity before disclosing amounts, and enforces 7-in-7 calling frequency limits strictly.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Statutory Mini-Miranda Delivered</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>TCPA Local Calling Window Enforced</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Cease &amp; Desist Instant Hold Hook</span>
              </div>
            </div>
          </div>

          {/* Card 4: Instant Payment Rails & SMS Link (4 cols) */}
          <div className="md:col-span-4 p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                Instant SMS Payment Rails
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                When a borrower agrees to pay, Recovra immediately dispatches a secure, tokenized checkout link (Apple Pay, Google Pay, ACH) while they remain on the line.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono shadow-sm">
              <span className="text-zinc-600 dark:text-zinc-400">recovra.pay/inv-8821</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                SENT
              </span>
            </div>
          </div>

          {/* Card 5: Real-time Supervisor Console (4 cols) */}
          <div className="md:col-span-4 p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                Supervisor Live Console
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Watch active calls in real time. Supervisors can monitor transcripts live, whisper guidance to the agent, or take over with a single click.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-between text-xs font-semibold text-zinc-900 dark:text-white hover:underline pt-2"
            >
              <span>Explore Operations Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
