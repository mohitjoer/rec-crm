'use client';

import React from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  ShieldCheck,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Account, CallRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AINegotiationCard } from '@/components/dashboard/AINegotiationCard';

interface AccountDetailPaneProps {
  selectedAccount: Account | null;
  recentCall: CallRecord | null;
  renderStatusBadge: (status: string, daysPastDue: number) => React.ReactNode;
}

export function AccountDetailPane({
  selectedAccount,
  recentCall,
  renderStatusBadge,
}: AccountDetailPaneProps) {
  if (!selectedAccount) {
    return (
      <Card className="min-w-0 xl:col-span-5 p-12 text-center text-xs text-zinc-500">
        Select an account from the ledger to inspect details.
      </Card>
    );
  }

  return (
    <div className="min-w-0 xl:col-span-5 space-y-4">
      {/* Header Dossier Card */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-11 h-11 text-sm font-bold">
              <AvatarFallback>{selectedAccount.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="truncate">{selectedAccount.name}</CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {selectedAccount.originalCreditor} &bull; {selectedAccount.id}
              </p>
            </div>
          </div>

          <Link href="/logs">
            <Button size="sm" variant="default" className="gap-1.5 font-bold">
              <PhoneCall className="w-3.5 h-3.5 text-zinc-950 dark:text-zinc-950" />
              <span>View Call History</span>
            </Button>
          </Link>
        </div>

        {/* Quick Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200 dark:border-[#18181d] text-xs transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Status:</span>
            {renderStatusBadge(selectedAccount.status, selectedAccount.daysPastDue)}
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
            Phone: {selectedAccount.phone}
          </span>
        </div>
      </Card>

      {/* AI Intelligence & Next Best Action Card */}
      <AINegotiationCard account={selectedAccount} />

      {/* Overview Key-Value Table Card */}
      <Card className="overflow-hidden">
        <CardHeader className="py-3 bg-zinc-50/80 dark:bg-[#0c0c0e] flex flex-row items-center justify-between">
          <CardTitle className="text-xs uppercase tracking-wider">Overview</CardTitle>
          <span className="text-[10px] text-zinc-500 font-normal lowercase">account dossier</span>
        </CardHeader>

        <CardContent className="p-0 divide-y divide-zinc-200 dark:divide-[#18181d] text-xs transition-colors">
          <div className="grid grid-cols-12 px-5 py-2.5 items-center">
            <div className="col-span-5 flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              <span>Contact Details</span>
            </div>
            <div className="col-span-7 text-zinc-900 dark:text-white font-medium text-right sm:text-left truncate">
              {selectedAccount.phone} &bull; {selectedAccount.email || 'Direct Phone'}
            </div>
          </div>

          <div className="grid grid-cols-12 px-5 py-2.5 items-center">
            <div className="col-span-5 flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              <span>Current Balance</span>
            </div>
            <div className="col-span-7 font-bold text-zinc-900 dark:text-white text-right sm:text-left">
              ${selectedAccount.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="grid grid-cols-12 px-5 py-2.5 items-center">
            <div className="col-span-5 flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              <span>Original Balance</span>
            </div>
            <div className="col-span-7 text-zinc-700 dark:text-zinc-300 text-right sm:text-left">
              ${selectedAccount.originalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="grid grid-cols-12 px-5 py-2.5 items-center">
            <div className="col-span-5 flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
              <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              <span>Aging Level</span>
            </div>
            <div className="col-span-7 text-zinc-800 dark:text-zinc-200 text-right sm:text-left">
              <span className="font-semibold text-amber-600 dark:text-amber-300">{selectedAccount.daysPastDue} Days</span> ({selectedAccount.bucket.replace(/_/g, ' ')})
            </div>
          </div>

          <div className="grid grid-cols-12 px-5 py-2.5 items-center">
            <div className="col-span-5 flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              <span>Commitment</span>
            </div>
            <div className="col-span-7 text-right sm:text-left font-medium">
              {selectedAccount.status === 'PROMISE_TO_PAY' && selectedAccount.promiseToPay ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  ${selectedAccount.promiseToPay.amount.toFixed(2)} on {selectedAccount.promiseToPay.date}
                </span>
              ) : selectedAccount.paymentPlan ? (
                <span className="text-zinc-800 dark:text-zinc-200">
                  ${selectedAccount.paymentPlan.monthlyAmount}/mo ({selectedAccount.paymentPlan.months} mos)
                </span>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500">None scheduled yet</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-12 px-5 py-2.5 items-center">
            <div className="col-span-5 flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              <span>Audit Score</span>
            </div>
            {recentCall ? (
              <div className="col-span-7 text-right sm:text-left text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${recentCall.complianceScore >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>{recentCall.complianceScore}% Compliant &bull; {recentCall.miniMirandaPassed ? 'Mini-Miranda Verified' : 'Standard'}</span>
              </div>
            ) : (
              <div className="col-span-7 text-right sm:text-left text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Audit Ready &bull; FDCPA Compliant</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voice Notes / Session Card */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
          <span>Voice Session Intelligence</span>
          <span className="text-[10px] text-zinc-500 font-normal lowercase">audit logs</span>
        </div>

        <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-[#131317] p-3.5 rounded-xl border border-zinc-200 dark:border-[#202028] space-y-2 transition-colors">
          {recentCall ? (
            <>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pb-1.5 border-b border-zinc-200 dark:border-[#24242c]">
                <span>
                  Latest Voice Session ({Math.floor(recentCall.durationSeconds / 60)}m {recentCall.durationSeconds % 60}s)
                </span>
                <span className="text-zinc-900 dark:text-white font-mono font-semibold">Sentiment: {recentCall.sentiment}</span>
              </div>
              <p className="text-zinc-700 dark:text-zinc-300">{recentCall.summary}</p>
            </>
          ) : (
            <p className="text-zinc-500 dark:text-zinc-400">
              Empathetic conversational outreach scheduled. Identity verification and Mini-Miranda disclosures enforced before negotiating settlement terms or payment arrangements.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-1 flex items-center justify-end gap-2 text-xs">
          <Link href="/logs">
            <Button size="sm" variant="default" className="gap-1.5 font-bold">
              <PhoneCall className="w-3.5 h-3.5 text-zinc-950 dark:text-zinc-950" />
              <span>View Call Logs</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
