'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface PricingSectionProps {
  onOpenDemoModal?: () => void;
}

export function PricingSection({ onOpenDemoModal }: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6 md:px-12 bg-zinc-50 dark:bg-[#0c0c0e] border-t border-zinc-200 dark:border-zinc-800/80">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
            Transparent Plans
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Predictable SaaS subscription tiers.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            Zero contingency commission fees. Keep 100% of the money you recover.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                !isAnnual
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                isAnnual
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter Tier */}
          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Starter
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">
                  ${isAnnual ? '399' : '499'}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">/month</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                For growth startups and boutique lenders automating early delinquent accounts.
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
                  <span>2,500 Conversational Voice Minutes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
                  <span>Automated SMS Payment Links</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
                  <span>Statutory Mini-Miranda Guardrails</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
                  <span>Promise-to-Pay Ledger Sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
                  <span>3 Operator Console Seats</span>
                </li>
              </ul>
            </div>
            <Link
              href="/auth/sign-up"
              className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-white font-semibold text-xs rounded-xl text-center transition-colors border border-zinc-200 dark:border-zinc-700"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Growth Tier */}
          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/80 border-2 border-zinc-900 dark:border-white space-y-6 flex flex-col justify-between shadow-xl relative">
            <div className="absolute -top-3 right-6">
              <Badge variant="default" className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold text-[10px]">
                Most Popular
              </Badge>
            </div>
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                Growth
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">
                  ${isAnnual ? '1,199' : '1,499'}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">/month</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                For mid-market recovery teams scaling automated voice campaigns.
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
                  <span>10,000 Conversational Voice Minutes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
                  <span>Automated Outbound Dialing Queues</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
                  <span>Custom Settlement &amp; Discount Rules</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
                  <span>Multi-Tenant Team Workspace</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
                  <span>10 Operator Console Seats</span>
                </li>
              </ul>
            </div>
            <Link
              href="/auth/sign-up"
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-bold text-xs rounded-xl text-center transition-colors shadow-sm"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Enterprise Tier */}
          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Enterprise
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">Custom</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                For financial institutions, banks, and national loan servicers.
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
                  <span>Custom Voice Minutes &amp; Dedicated SIP Trunks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
                  <span>Direct Core Banking &amp; Webhook Integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
                  <span>Dedicated Compliance Auditor &amp; SLA</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
                  <span>Custom Jurisdiction DPD Rules</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
                  <span>Unlimited Workspace Seats</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onOpenDemoModal}
              className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-white font-semibold text-xs rounded-xl text-center transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
