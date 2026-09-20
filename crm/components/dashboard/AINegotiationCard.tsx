'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Clock,
  ShieldCheck,
  PhoneCall,
} from 'lucide-react';
import { Account } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AINegotiationCardProps {
  account: Account;
}

export function AINegotiationCard({ account }: AINegotiationCardProps) {
  const isHighDpd = account.daysPastDue >= 60;
  const recommendedDiscount = account.maxDiscountPercent || 20;
  const discountedPayoff = Math.round(account.currentBalance * (1 - recommendedDiscount / 100));

  return (
    <Card className="p-4 space-y-3 bg-white dark:bg-[#111114] border-zinc-200 dark:border-[#25252b] relative overflow-hidden transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-zinc-900 dark:text-white" />
          <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            AI Negotiation Intelligence
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono">
          {account.riskScore ? `${account.riskScore}% Risk Index` : 'FDCPA Verified'}
        </Badge>
      </div>

      {/* Recommended Strategy Box */}
      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs transition-colors">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Recommended Strategy:</span>
          <span className="text-zinc-900 dark:text-white font-bold">
            {isHighDpd ? `Settlement Payoff ($${discountedPayoff.toLocaleString()})` : 'Flexible 4-Mo Installment'}
          </span>
        </div>
        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {isHighDpd
            ? `AI engine recommends offering up to ${recommendedDiscount}% lump-sum settlement discount to resolve balance before 90-day aging.`
            : 'AI suggests initiating contact during TCPA-compliant hours and offering bi-weekly autopay installments.'}
        </p>
      </div>

      {/* Real-time telemetry items */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 transition-colors">
          <Clock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          <div>
            <span className="text-[9px] text-zinc-500 block uppercase font-medium">TCPA Window</span>
            <span className="text-zinc-900 dark:text-zinc-200 font-semibold">8:00 AM – 9:00 PM</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 transition-colors">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <span className="text-[9px] text-zinc-500 block uppercase font-medium">FDCPA Verification</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Mini-Miranda Ready</span>
          </div>
        </div>
      </div>

      {/* Quick Call Action */}
      <div className="pt-1">
        <Link href="/logs">
          <Button size="sm" variant="default" className="w-full font-bold text-xs gap-1.5 rounded-xl shadow">
            <PhoneCall className="w-3.5 h-3.5 text-zinc-950 dark:text-zinc-950" />
            <span>View Call Logs</span>
          </Button>
        </Link>
      </div>
    </Card>
  );
}
