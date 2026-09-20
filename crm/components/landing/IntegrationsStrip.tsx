'use client';

import React from 'react';
import { ShieldCheck, Zap, Lock, RefreshCw } from 'lucide-react';

const INTEGRATIONS = [
  { name: 'Stripe', category: 'Billing & Invoicing' },
  { name: 'Twilio', category: 'Telephony & SIP' },
  { name: 'QuickBooks', category: 'Accounting Ledger' },
  { name: 'Salesforce', category: 'CRM & Records' },
  { name: 'Plaid', category: 'Bank Verification' },
  { name: 'HubSpot', category: 'Contact Pipelines' },
];

const PLATFORM_SPECS = [
  {
    label: 'Low-Latency Voice Engine',
    desc: 'Sub-250ms conversational turn pacing for natural dialogue',
    icon: Zap,
  },
  {
    label: 'Regulatory Guardrails',
    desc: 'Hardcoded FDCPA Mini-Miranda disclosures & TCPA calling hours',
    icon: ShieldCheck,
  },
  {
    label: 'Financial Ledger Sync',
    desc: 'Real-time reconciliation of promises to pay and settled balances',
    icon: RefreshCw,
  },
  {
    label: 'Enterprise Security',
    desc: 'End-to-end encrypted voice audio and cryptographic audit logs',
    icon: Lock,
  },
];

export function IntegrationsStrip() {
  return (
    <section className="py-14 border-y border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40">
      <div className="max-w-6xl mx-auto px-6 md:px-12 space-y-12">
        {/* Real Ecosystem Integrations Strip */}
        <div className="space-y-4 text-center">
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Engineered to connect with your financial and telephony stack
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 items-center justify-items-center">
            {INTEGRATIONS.map((item) => (
              <div
                key={item.name}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 w-full h-16 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-xs"
              >
                <span className="font-semibold text-xs tracking-tight text-zinc-900 dark:text-zinc-100">
                  {item.name}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400">
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Verifiable Platform Specifications */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
          {PLATFORM_SPECS.map((spec) => {
            const Icon = spec.icon;
            return (
              <div key={spec.label} className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                  </div>
                  <span className="font-semibold text-xs tracking-tight">
                    {spec.label}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {spec.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
