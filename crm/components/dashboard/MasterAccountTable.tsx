'use client';

import React from 'react';
import { User, ChevronRight, Layers, Sparkles, TrendingUp } from 'lucide-react';
import { Account } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface MasterAccountTableProps {
  accounts: Account[];
  selectedAccountId?: string | null;
  onSelectAccount?: (id: string) => void;
  renderStatusBadge: (status: string, daysPastDue: number) => React.ReactNode;
}

function getRecoveryPropensity(acc: Account): { score: number; label: string; variant: 'success' | 'warning' | 'secondary' | 'outline' } {
  if (acc.status === 'SETTLED') return { score: 100, label: 'Settled', variant: 'outline' };
  if (acc.status === 'PROMISE_TO_PAY') return { score: 94, label: '94% High', variant: 'success' };
  if (acc.status === 'INSTALLMENT_PLAN') return { score: 88, label: '88% High', variant: 'success' };
  if (acc.status === 'DISPUTED') return { score: 26, label: '26% Low', variant: 'secondary' };
  if (acc.status === 'HARDSHIP_HOLD') return { score: 22, label: '22% Hold', variant: 'secondary' };

  if (acc.daysPastDue < 30) return { score: 91, label: '91% High', variant: 'success' };
  if (acc.daysPastDue < 60) return { score: 76, label: '76% Med', variant: 'warning' };
  if (acc.daysPastDue < 90) return { score: 54, label: '54% Med', variant: 'warning' };
  return { score: 32, label: '32% Low', variant: 'secondary' };
}

function getNextBestAction(acc: Account): string {
  if (acc.status === 'PROMISE_TO_PAY') return 'Send reminder SMS';
  if (acc.status === 'HARDSHIP_HOLD') return 'Hold active review';
  if (acc.daysPastDue >= 90) return 'Offer 25% settlement';
  if (acc.daysPastDue >= 60) return 'Propose 4-mo plan';
  return 'Initiate intro voice call';
}

export function MasterAccountTable({
  accounts,
  selectedAccountId,
  onSelectAccount,
  renderStatusBadge,
}: MasterAccountTableProps) {
  return (
    <Card className="w-full min-w-0 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/80 dark:bg-[#0c0c0e]">
              <TableHead className="w-[40%]">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Debtor &amp; Creditor</span>
                </div>
              </TableHead>
              <TableHead className="w-[20%]">Status</TableHead>
              <TableHead className="w-[20%]">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                  <span>AI Propensity</span>
                </div>
              </TableHead>
              <TableHead className="w-[20%] text-right">Balance / DPD</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-16 text-zinc-500">
                  <Layers className="w-8 h-8 mx-auto mb-2 text-zinc-400 dark:text-zinc-600" />
                  No accounts match the selected filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => {
                const isSelected = selectedAccountId === account.id;
                const propensity = getRecoveryPropensity(account);
                const nextAction = getNextBestAction(account);
                const initials = account.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <TableRow
                    key={account.id}
                    onClick={() => onSelectAccount?.(account.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-zinc-100/90 border-l-2 border-l-zinc-900 dark:bg-[#15151a] dark:border-l-white'
                        : 'hover:bg-zinc-50 dark:hover:bg-[#131316]'
                    }`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-2 ring-white dark:ring-zinc-950 ${
                              propensity.score >= 70 ? 'bg-emerald-500' : propensity.score >= 40 ? 'bg-amber-500' : 'bg-zinc-400'
                            }`}
                          />
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="font-semibold text-zinc-900 dark:text-white truncate flex items-center gap-1.5">
                            <span>{account.name}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {account.originalCreditor} &bull; {account.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {renderStatusBadge(account.status, account.daysPastDue)}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={propensity.variant} className="text-[10px] px-2 py-0 font-mono">
                            {propensity.label}
                          </Badge>
                        </div>
                        <div className="w-20 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-zinc-900 dark:bg-white rounded-full"
                            style={{ width: `${propensity.score}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate max-w-[120px]">
                          {nextAction}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-white">
                            ${account.currentBalance.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {account.daysPastDue}d overdue
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 transition-colors ${
                            isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-600'
                          }`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
