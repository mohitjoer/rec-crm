'use client';

import React, { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import useSWR from 'swr';
import {
  Search,
  Plus,
  Users,
  ChevronRight,
  Loader2,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  PhoneCall,
} from 'lucide-react';
import { Account, AccountStatus, DpdBucket } from '@/lib/types';
import { fetcher } from '@/lib/fetcher';
import { NewAccountModal } from '@/components/accounts/NewAccountModal';
import { AccountDossierDrawer } from '@/components/accounts/AccountDossierDrawer';

export const ACCOUNT_STATUS_META: Record<
  AccountStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: 'Active Delinquency',
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
  },
  PROMISE_TO_PAY: {
    label: 'Promise to Pay',
    className:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
  },
  INSTALLMENT_PLAN: {
    label: 'Installment Plan',
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
  },
  SETTLED: {
    label: 'Settled in Full',
    className:
      'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  },
  DISPUTED: {
    label: 'Disputed',
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
  },
  HARDSHIP_HOLD: {
    label: 'Hardship Hold',
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
  },
  UNREACHABLE: {
    label: 'Unreachable',
    className:
      'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
  },
};

function getPropensityMeta(acc: Account) {
  if (acc.status === 'SETTLED') return { score: 100, label: 'Settled', color: 'text-zinc-500' };
  if (acc.status === 'PROMISE_TO_PAY') return { score: 94, label: '94% High', color: 'text-emerald-500' };
  if (acc.status === 'INSTALLMENT_PLAN') return { score: 88, label: '88% High', color: 'text-emerald-500' };
  if (acc.status === 'DISPUTED') return { score: 26, label: '26% Low', color: 'text-red-500' };
  if (acc.status === 'HARDSHIP_HOLD') return { score: 22, label: '22% Hold', color: 'text-blue-500' };

  if (acc.daysPastDue < 30) return { score: 91, label: '91% High', color: 'text-emerald-500' };
  if (acc.daysPastDue < 60) return { score: 76, label: '76% Med', color: 'text-amber-500' };
  if (acc.daysPastDue < 90) return { score: 54, label: '54% Med', color: 'text-amber-500' };
  return { score: 32, label: '32% Low', color: 'text-zinc-400' };
}

const subscribeNoop = () => () => {};
const returnTrue = () => true;
const returnFalse = () => false;
const EMPTY_ACCOUNTS: Account[] = [];

type TabFilter = 'ALL' | 'ACTIVE' | 'PROMISE_TO_PAY' | 'INSTALLMENT_PLAN' | 'SETTLED' | 'HOLDS';

// react-doctor-disable-next-line react-doctor/duplicate-jsx-subtree
function AccountsTableHeader() {
  return (
    <thead className="text-[10px] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider font-bold bg-zinc-50/70 dark:bg-zinc-900/50">
      <tr>
        <th className="py-3 pl-5">Account ID</th>
        <th className="py-3">Debtor &amp; Contact</th>
        <th className="py-3">Original Creditor</th>
        <th className="py-3">Current Balance</th>
        <th className="py-3">Aging &amp; DPD</th>
        <th className="py-3">Status</th>
        <th className="py-3">AI Propensity</th>
        <th className="py-3 pr-5 text-right">Actions</th>
      </tr>
    </thead>
  );
}

export default function AccountsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [bucketFilter, setBucketFilter] = useState('ALL');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // SSR-safe mount detection
  const mounted = useSyncExternalStore(subscribeNoop, returnTrue, returnFalse);

  // Close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedAccount(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data, mutate, isLoading, isValidating } = useSWR<{ accounts: Account[] }>('/api/accounts', fetcher, {
    revalidateOnFocus: false,
  });

  const accounts = data?.accounts ?? EMPTY_ACCOUNTS;

  const counts = useMemo(() => {
    const res = {
      ALL: accounts.length,
      ACTIVE: 0,
      PROMISE_TO_PAY: 0,
      INSTALLMENT_PLAN: 0,
      SETTLED: 0,
      HOLDS: 0,
    };
    for (const acc of accounts) {
      if (acc.status === 'ACTIVE') res.ACTIVE++;
      else if (acc.status === 'PROMISE_TO_PAY') res.PROMISE_TO_PAY++;
      else if (acc.status === 'INSTALLMENT_PLAN') res.INSTALLMENT_PLAN++;
      else if (acc.status === 'SETTLED') res.SETTLED++;
      else if (acc.status === 'DISPUTED' || acc.status === 'HARDSHIP_HOLD' || acc.status === 'UNREACHABLE') res.HOLDS++;
    }
    return res;
  }, [accounts]);

  const totalOutstanding = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (activeTab === 'ACTIVE' && acc.status !== 'ACTIVE') return false;
      if (activeTab === 'PROMISE_TO_PAY' && acc.status !== 'PROMISE_TO_PAY') return false;
      if (activeTab === 'INSTALLMENT_PLAN' && acc.status !== 'INSTALLMENT_PLAN') return false;
      if (activeTab === 'SETTLED' && acc.status !== 'SETTLED') return false;
      if (activeTab === 'HOLDS' && acc.status !== 'DISPUTED' && acc.status !== 'HARDSHIP_HOLD' && acc.status !== 'UNREACHABLE') return false;

      if (bucketFilter !== 'ALL' && acc.bucket !== bucketFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          acc.name.toLowerCase().includes(q) ||
          acc.id.toLowerCase().includes(q) ||
          acc.phone.toLowerCase().includes(q) ||
          acc.originalCreditor.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [accounts, searchQuery, activeTab, bucketFilter]);

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Segmented Navigation Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-px overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Accounts', count: counts.ALL },
          { id: 'ACTIVE', label: 'Active Delinquency', count: counts.ACTIVE },
          { id: 'PROMISE_TO_PAY', label: 'Promise to Pay', count: counts.PROMISE_TO_PAY },
          { id: 'INSTALLMENT_PLAN', label: 'Installment Plan', count: counts.INSTALLMENT_PLAN },
          { id: 'SETTLED', label: 'Settled', count: counts.SETTLED },
          { id: 'HOLDS', label: 'Disputed & Holds', count: counts.HOLDS },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabFilter)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white bg-zinc-50/50 dark:bg-zinc-900/50'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.id
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Input Bar & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search accounts by debtor name, account ID, phone, or creditor..."
            aria-label="Search debtor accounts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-colors placeholder:text-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="bucket-filter-select"
            aria-label="Filter by aging bucket"
            value={bucketFilter}
            onChange={(e) => setBucketFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-900 dark:focus:border-white cursor-pointer"
          >
            <option value="ALL">All Aging Buckets</option>
            <option value="30_DPD">30 Days Past Due</option>
            <option value="60_DPD">60 Days Past Due</option>
            <option value="90_DPD">90 Days Past Due</option>
            <option value="120_PLUS_CHARGE_OFF">120+ DPD / Charge-off</option>
          </select>

          {(bucketFilter !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setBucketFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-2 py-1 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={() => mutate()}
            aria-label="Refresh accounts ledger"
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Master Accounts Table */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <AccountsTableHeader />
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <Loader2 className="w-6 h-6 text-zinc-400 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <Users className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {accounts.length === 0
                        ? 'No accounts registered in collection ledger.'
                        : 'No accounts match the current filter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const isSelected = selectedAccount?.id === acc.id;
                  const statusMeta =
                    ACCOUNT_STATUS_META[acc.status] || ACCOUNT_STATUS_META.ACTIVE;
                  const propensity = getPropensityMeta(acc);

                  return (
                    <tr
                      key={acc.id}
                      onClick={() => setSelectedAccount(acc)}
                      className={`cursor-pointer transition-colors group ${
                        isSelected
                          ? 'bg-zinc-100/80 dark:bg-zinc-800/70'
                          : 'hover:bg-zinc-50/70 dark:hover:bg-zinc-850/40'
                      }`}
                    >
                      <td className="py-3 pl-5">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                          {acc.id}
                        </span>
                      </td>

                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-900 dark:text-white text-xs group-hover:underline">
                            {acc.name}
                          </span>
                          {acc.country && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                              {acc.country}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {acc.phone} {acc.email ? `• ${acc.email}` : ''}
                        </div>
                      </td>

                      <td className="py-3 font-medium text-zinc-800 dark:text-zinc-200 text-xs">
                        {acc.originalCreditor}
                      </td>

                      <td className="py-3">
                        <div className="font-semibold text-zinc-900 dark:text-white text-xs">
                          ${acc.currentBalance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {acc.overdueAmount != null ? (
                            <span>
                              Overdue: ${acc.overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              {acc.predueAmount ? ` • Pre: $${acc.predueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ''}
                            </span>
                          ) : (
                            <span>Orig: ${acc.originalBalance.toLocaleString()}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3">
                        <div className="font-medium text-zinc-900 dark:text-white text-xs">
                          {acc.daysPastDue} Days
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {acc.bucket.replace(/_/g, ' ')}
                        </div>
                      </td>

                      <td className="py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>

                      <td className="py-3">
                        <div className="space-y-1 w-24">
                          <div className={`text-[11px] font-mono font-bold ${propensity.color}`}>
                            {propensity.label}
                          </div>
                          <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-zinc-900 dark:bg-white rounded-full transition-[width] duration-300"
                              style={{ width: `${propensity.score}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 text-right pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAccount(acc);
                            }}
                            title={`Trigger call on due amount ($${(acc.overdueAmount != null && acc.overdueAmount > 0 ? acc.overdueAmount : acc.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 hover:bg-zinc-900 hover:text-white dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-white dark:hover:text-zinc-950 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <PhoneCall className="w-3 h-3 text-emerald-500" />
                            <span className="hidden md:inline">Trigger Call</span>
                          </button>
                          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over Side Panel Drawer for Account Dossier */}
      {mounted &&
        selectedAccount &&
        createPortal(
          <AccountDossierDrawer
            account={selectedAccount}
            onClose={() => setSelectedAccount(null)}
            onAccountUpdated={(updated) => {
              setSelectedAccount(updated);
              mutate();
            }}
          />,
          document.body
        )}

      {/* Add New Account Modal */}
      {showNewModal && (
        <NewAccountModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => mutate()}
        />
      )}
    </div>
  );
}
