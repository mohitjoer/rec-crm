'use client';

import React from 'react';
import { PhoneCall } from 'lucide-react';
import { Account } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AccountsTableProps {
  accounts: Account[];
  onSelectAccount: (acc: Account) => void;
}

export function AccountsTable({ accounts, onSelectAccount }: AccountsTableProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'warning';
      case 'PROMISE_TO_PAY':
        return 'success';
      case 'INSTALLMENT_PLAN':
        return 'purple';
      case 'SETTLED':
        return 'default';
      case 'DISPUTED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider font-semibold">
            <tr>
              <th className="pb-3 pl-2">Account / Debtor</th>
              <th className="pb-3">Creditor</th>
              <th className="pb-3">Current Balance</th>
              <th className="pb-3">Aging (DPD)</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Max Settlement</th>
              <th className="pb-3 text-right pr-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
            {accounts.map((acc) => (
              <tr
                key={acc.id}
                onClick={() => onSelectAccount(acc)}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
              >
                <td className="py-3.5 pl-2">
                  <div className="font-bold text-zinc-900 dark:text-white text-sm">{acc.name}</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {acc.id} • {acc.phone}
                  </div>
                </td>
                <td className="py-3.5">
                  <div className="text-zinc-900 dark:text-zinc-200 font-medium">{acc.originalCreditor}</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{acc.accountNumber}</div>
                </td>
                <td className="py-3.5 font-bold text-zinc-900 dark:text-white text-sm">
                  ${acc.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200">{acc.daysPastDue}d</span>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{acc.bucket}</div>
                </td>
                <td className="py-3.5">
                  <Badge variant={getStatusBadgeVariant(acc.status) as any}>
                    {acc.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="py-3.5 text-zinc-700 dark:text-zinc-300">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    ${(acc.currentBalance * (1 - acc.maxDiscountPercent / 100)).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{acc.maxDiscountPercent}% max disc</div>
                </td>
                <td className="py-3.5 text-right pr-2">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAccount(acc);
                      }}
                      className="font-bold px-3 py-1.5 rounded-lg text-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-zinc-950 dark:text-zinc-950" />
                      <span>Inspect</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-zinc-500 text-xs">
                  No accounts found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
