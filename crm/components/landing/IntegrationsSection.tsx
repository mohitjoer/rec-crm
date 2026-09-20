'use client';

import React from 'react';
import { Layers, ArrowUpRight } from 'lucide-react';

export interface IntegrationsSectionProps {
  onOpenDemoModal?: () => void;
}

const CATEGORIES = [
  {
    name: 'Billing & Accounting',
    tools: ['Stripe', 'QuickBooks', 'Xero', 'NetSuite', 'Razorpay', 'Zoho Books'],
    description: 'Sync past-due balances, invoice schedules, and settlement receipts in real time.',
  },
  {
    name: 'Telephony & Carrier Networks',
    tools: ['Twilio', 'SIP Trunking', 'Telnyx', 'Carrier Networks', 'Plivo'],
    description: 'Low-latency bidirectional audio streams with dynamic localized outbound caller IDs.',
  },
  {
    name: 'CRM & Enterprise Data',
    tools: ['Salesforce', 'HubSpot', 'Zoho CRM', 'PostgreSQL', 'Webhooks / REST'],
    description: 'Stream call outcomes, promise-to-pay commitments, and call transcripts into your systems of record.',
  },
];

export function IntegrationsSection({ onOpenDemoModal }: IntegrationsSectionProps) {
  return (
    <section id="integrations" className="py-24 px-6 md:px-12 bg-white dark:bg-[#09090b] border-t border-zinc-200 dark:border-zinc-800/80">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            <Layers className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
            <span>Infrastructure Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-tight">
            Connects with your billing, telephony, and CRM stack.
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Recovra is designed to fit your existing financial operations without requiring costly migrations or custom engineering.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{cat.name}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{cat.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                {cat.tools.map((tool) => (
                  <span
                    key={tool}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-800 dark:text-zinc-300"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600 dark:text-zinc-400">
          <span>Need a bespoke accounting connector or enterprise webhook configuration?</span>
          <button
            onClick={onOpenDemoModal}
            className="inline-flex items-center gap-1.5 text-zinc-900 dark:text-white hover:text-zinc-700 dark:hover:text-zinc-300 font-semibold transition-colors cursor-pointer"
          >
            <span>Request custom connector</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
