'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CtaBannerProps {
  onOpenDemoModal?: () => void;
}

export function CtaBanner({ onOpenDemoModal }: CtaBannerProps) {
  return (
    <section className="py-24 px-6 md:px-12 bg-zinc-50 dark:bg-[#0c0c0e] border-t border-zinc-200 dark:border-zinc-800/80 text-center">
      <div className="max-w-4xl mx-auto space-y-7">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>SOC 2 Type II Certified Architecture</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight leading-tight">
          Ready to put your collections on autopilot?
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Deploy conversational voice agents that resolve overdue accounts, adhere strictly to compliance rules, and log commitments straight into your ledger.
        </p>

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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-100 text-xs font-semibold h-12 px-7 rounded-full border border-zinc-200 dark:border-zinc-800 transition-colors shadow-xs"
          >
            <span>Launch Operations Console</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
          </Link>
        </div>
      </div>
    </section>
  );
}
