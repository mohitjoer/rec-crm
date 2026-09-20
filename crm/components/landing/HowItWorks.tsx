'use client';

import React from 'react';
import { Database, PhoneCall, ShieldCheck, CheckCircle2, type LucideIcon, Workflow } from 'lucide-react';

interface StageItem {
  step: string;
  title: string;
  desc: string;
  icon: LucideIcon;
}

const STAGES: StageItem[] = [
  {
    step: '01',
    title: 'Ingest Overdue Accounts',
    desc: 'Connect billing systems (Stripe, QuickBooks, CSV) or trigger via REST API. Recovra unifies debtor balance, contact details, and prior notes into an active account profile.',
    icon: Database,
  },
  {
    step: '02',
    title: 'Configure CFO Rules & Boundaries',
    desc: 'Define maximum settlement discount caps, payment installment bounds, calling frequency limits, and daily calling hour windows for each portfolio.',
    icon: ShieldCheck,
  },
  {
    step: '03',
    title: 'Autonomous Voice Outreach',
    desc: 'Empathetic voice agents engage debtors with sub-250ms latency. The agent delivers mandatory Mini-Miranda disclosures and negotiates payment arrangements.',
    icon: PhoneCall,
  },
  {
    step: '04',
    title: 'Instant Resolution & Ledger Sync',
    desc: 'When a debtor commits to a plan, Recovra sends an immediate payment link via SMS and automatically logs promises to pay into your CRM ledger.',
    icon: CheckCircle2,
  },
];

export function HowItWorks() {
  return (
    <section id="architecture" className="py-24 px-6 md:px-12 bg-zinc-50 dark:bg-[#0c0c0e] border-t border-zinc-200 dark:border-zinc-800/80">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-mono">
            <Workflow className="w-3.5 h-3.5" />
            <span>Execution Lifecycle</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-tight">
            How Recovra resolves overdue balances end-to-end.
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Every step is automated, compliant with federal regulations, and visible inside your real-time operations console.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAGES.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 space-y-4 flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 font-bold">{s.step}</span>
                    <Icon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">{s.title}</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
