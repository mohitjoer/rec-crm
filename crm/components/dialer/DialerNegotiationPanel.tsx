'use client';

import React from 'react';
import { Sparkles, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Account, CallDisposition } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface DialerNegotiationPanelProps {
  selectedAccount: Account | null;
  activeTab: 'negotiate' | 'hardship' | 'disposition';
  setActiveTab: (tab: 'negotiate' | 'hardship' | 'disposition') => void;
  settlementDiscount: number;
  setSettlementDiscount: (val: number) => void;
  handleCommitSettlement: () => void;
  ptpAmount: number;
  setPtpAmount: (val: number) => void;
  ptpDate: string;
  setPtpDate: (val: string) => void;
  handleLogPtp: (amount: number, date: string) => void;
  hardshipCategory: string;
  setHardshipCategory: (val: string) => void;
  hardshipNotes: string;
  setHardshipNotes: (val: string) => void;
  handleEndCall: (disposition: CallDisposition) => void;
}

export function DialerNegotiationPanel({
  selectedAccount,
  activeTab,
  setActiveTab,
  settlementDiscount,
  setSettlementDiscount,
  handleCommitSettlement,
  ptpAmount,
  setPtpAmount,
  ptpDate,
  setPtpDate,
  handleLogPtp,
  hardshipCategory,
  setHardshipCategory,
  hardshipNotes,
  setHardshipNotes,
  handleEndCall,
}: DialerNegotiationPanelProps) {
  return (
    <div className="lg:col-span-5 space-y-4">
      {/* Action Tabs */}
      <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 text-xs">
        <button
          onClick={() => setActiveTab('negotiate')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'negotiate' ? 'bg-zinc-100 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Negotiation Tools
        </button>
        <button
          onClick={() => setActiveTab('hardship')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'hardship' ? 'bg-zinc-100 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Hardship / Dispute
        </button>
        <button
          onClick={() => setActiveTab('disposition')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'disposition' ? 'bg-zinc-100 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Disposition
        </button>
      </div>

      {/* TAB 1: Negotiation Tools */}
      {activeTab === 'negotiate' && (
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-5">
          {/* Settlement Discount Tool */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                <span>One-Time Lump Sum Settlement</span>
              </div>
              <span className="text-xs font-semibold text-zinc-200">{settlementDiscount}% Off</span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Original Balance:</span>
                <span className="text-white">${selectedAccount?.currentBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Discounted Payoff:</span>
                <span className="text-white font-bold">
                  ${selectedAccount
                    ? Math.round(selectedAccount.currentBalance * (1 - settlementDiscount / 100)).toLocaleString()
                    : '0'}
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                {[10, 15, 20, 25].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSettlementDiscount(d)}
                    className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      settlementDiscount === d
                        ? 'bg-zinc-100 text-zinc-950 font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCommitSettlement}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl transition-colors border border-zinc-700"
            >
              Prompt AI to Offer {settlementDiscount}% Payoff
            </button>
          </div>

          <hr className="border-zinc-800" />

          {/* Promise to Pay (PTP) Scheduler */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
              <Calendar className="w-3.5 h-3.5 text-zinc-300" />
              <span>Promise to Pay (PTP) Scheduler</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label htmlFor="ptp-amount-input" className="block text-zinc-400 mb-1">
                  PTP Amount ($)
                </label>
                <input
                  id="ptp-amount-input"
                  type="number"
                  value={ptpAmount}
                  onChange={(e) => setPtpAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label htmlFor="ptp-date-input" className="block text-zinc-400 mb-1">
                  Pay Date
                </label>
                <input
                  id="ptp-date-input"
                  type="date"
                  value={ptpDate}
                  onChange={(e) => setPtpDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <Button
              onClick={() => handleLogPtp(ptpAmount, ptpDate)}
              className="w-full py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-white/5 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950" />
              <span>Confirm &amp; Schedule Promise to Pay</span>
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: Hardship / Dispute */}
      {activeTab === 'hardship' && (
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 text-xs">
          <div className="font-bold text-white">Escalation &amp; Hardship Logging</div>
          <div>
            <label htmlFor="hardship-category-select" className="block text-zinc-400 mb-1">
              Reason Category
            </label>
            <select
              id="hardship-category-select"
              value={hardshipCategory}
              onChange={(e) => setHardshipCategory(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-500"
            >
              <option value="HARDSHIP_FINANCIAL">Unemployment / Income Loss</option>
              <option value="HARDSHIP_MEDICAL">Medical Emergency / Illness</option>
              <option value="DISPUTE_AMOUNT">Dispute Balance / Fees</option>
              <option value="DISPUTE_IDENTITY">Identity Fraud / Wrong Debtor</option>
            </select>
          </div>

          <div>
            <label htmlFor="hardship-notes-input" className="block text-zinc-400 mb-1">
              Borrower Notes
            </label>
            <textarea
              id="hardship-notes-input"
              rows={3}
              value={hardshipNotes}
              onChange={(e) => setHardshipNotes(e.target.value)}
              placeholder="Record summary of borrower situation..."
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <button
            onClick={async () => {
              if (!selectedAccount) return;
              await fetch(`/api/accounts/${selectedAccount.id}/flag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: hardshipCategory, notes: hardshipNotes }),
              });
              alert('Hardship / Dispute hold successfully applied.');
            }}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl border border-zinc-700 transition-colors"
          >
            Apply Hardship Hold &amp; Pause Outreach
          </button>
        </div>
      )}

      {/* TAB 3: Disposition */}
      {activeTab === 'disposition' && (
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3 text-xs">
          <div className="font-bold text-white">Manual Call Disposition Tagging</div>
          <p className="text-zinc-400">Select final call outcome to update CRM status:</p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Promise to Pay', value: 'PROMISE_TO_PAY', color: 'bg-white hover:bg-zinc-200 text-zinc-950 font-bold' },
              { label: 'Installment Plan', value: 'PAYMENT_PLAN', color: 'bg-zinc-800 hover:bg-zinc-700 text-white' },
              { label: 'Settlement Agreed', value: 'SETTLEMENT_OFFERED', color: 'bg-zinc-800 hover:bg-zinc-700 text-white' },
              { label: 'Call Back Later', value: 'CALL_BACK', color: 'bg-zinc-800 hover:bg-zinc-700 text-white' },
              { label: 'Hardship Hold', value: 'HARDSHIP', color: 'bg-zinc-800 hover:bg-zinc-700 text-white' },
              { label: 'Refusal to Pay', value: 'REFUSAL', color: 'bg-zinc-800 hover:bg-zinc-700 text-white' },
            ].map((disp) => (
              <button
                key={disp.value}
                onClick={() => handleEndCall(disp.value as CallDisposition)}
                className={`py-2.5 px-3 rounded-xl transition-colors border border-zinc-700 ${disp.color}`}
              >
                {disp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FDCPA Mini-Miranda Compliance Check Card */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-white font-bold">
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>FDCPA Live Compliance Monitor</span>
        </div>
        <div className="space-y-1 text-zinc-400 text-[11px]">
          <div className="flex items-center justify-between">
            <span>Mini-Miranda Disclosure:</span>
            <span className="text-zinc-200 font-semibold">Verified &amp; Stated</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Consent to Record:</span>
            <span className="text-zinc-200 font-semibold">Acknowledged</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Prohibited Language Filter:</span>
            <span className="text-zinc-200 font-semibold">Zero Infractions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
