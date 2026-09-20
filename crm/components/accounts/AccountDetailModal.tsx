'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PhoneCall, CheckCircle2, X } from 'lucide-react';
import { Account } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface AccountDetailModalProps {
  account: Account;
  onClose: () => void;
  onAccountUpdated: (updated: Account) => void;
}

export function AccountDetailModal({ account, onClose, onAccountUpdated }: AccountDetailModalProps) {
  const [newNoteText, setNewNoteText] = useState('');

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    const noteObj = {
      id: `n-${Date.now()}`,
      text: newNoteText,
      date: new Date().toISOString().split('T')[0],
      author: 'Agent Operator',
    };
    const updatedNotes = [noteObj, ...(account.notes || [])];

    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: updatedNotes }),
      });
      if (res.ok) {
        const updatedAcc = await res.json();
        onAccountUpdated(updatedAcc);
        setNewNoteText('');
      }
    } catch (err) {
      console.error('Failed to save note to DB', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto [overflow-wrap:anywhere]">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {account.id}
            </span>
            <h2 className="text-xl font-bold text-white mt-1">{account.name}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close account details"
            className="shrink-0 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Bar */}
        <div className="flex gap-3">
          <Link
            href="/logs"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-white/5 transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-zinc-950" />
            <span>View Call History</span>
          </Link>
        </div>

        {/* Balances & DPD Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 uppercase font-semibold">Current Balance</span>
            <div className="text-xl font-bold text-white mt-1">
              ${account.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Original: ${account.originalBalance.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 uppercase font-semibold">Days Past Due</span>
            <div className="text-xl font-bold text-zinc-100 mt-1">{account.daysPastDue} Days</div>
            <div className="text-[11px] text-zinc-400 mt-1">Bucket: {account.bucket}</div>
          </div>
        </div>

        {/* Creditor & Contact */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
          <div className="font-semibold text-zinc-200">Account Overview</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-400">
            <div>
              Original Creditor: <strong className="text-zinc-200">{account.originalCreditor}</strong>
            </div>
            <div>
              Phone: <strong className="text-zinc-200">{account.phone}</strong>
            </div>
            <div>
              Email: <strong className="text-zinc-200">{account.email}</strong>
            </div>
            <div>
              Max Discount: <strong className="text-zinc-200">{account.maxDiscountPercent}%</strong>
            </div>
          </div>
        </div>

        {/* Promise to Pay */}
        {account.promiseToPay && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-700 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-200 font-bold">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Scheduled Promise to Pay</span>
            </div>
            <div className="text-white text-sm font-semibold">
              ${account.promiseToPay.amount.toFixed(2)} on {account.promiseToPay.date}
            </div>
            <div className="text-zinc-400 text-[11px]">
              Method: {account.promiseToPay.method} • Status: {account.promiseToPay.status}
            </div>
          </div>
        )}

        {/* Notes & Activity Log */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-zinc-300">
            <span>Account Activity & Voice Logs</span>
            <span className="text-zinc-400">{account.notes?.length || 0} entries</span>
          </div>

          <div className="flex gap-2">
            <label htmlFor="quick-note-input" className="sr-only">
              Add note
            </label>
            <input
              id="quick-note-input"
              type="text"
              aria-label="Add note to account"
              placeholder="Add operator note..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddNote();
              }}
              className="min-w-0 w-full flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            <Button
              onClick={handleAddNote}
              variant="secondary"
              className="text-white px-3 py-2 rounded-xl text-xs font-semibold"
            >
              Add
            </Button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {account.notes?.map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-300">{n.author}</span>
                  <span>{n.date}</span>
                </div>
                <p className="text-zinc-200">{n.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
