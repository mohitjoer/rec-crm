'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AccountStatus, DpdBucket } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface NewAccountModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewAccountModal({ onClose, onSuccess }: NewAccountModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    originalCreditor: 'Horizon Premier Visa',
    originalBalance: 1500,
    currentBalance: 1500,
    daysPastDue: 30,
    bucket: '30_DPD' as DpdBucket,
    status: 'ACTIVE' as AccountStatus,
    maxDiscountPercent: 20,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Failed to create account', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-base font-bold text-white">Create Debtor Account</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label htmlFor="new-acc-name" className="block text-zinc-300 mb-1 font-medium">
              Debtor Full Name
            </label>
            <input
              id="new-acc-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Robert Jackson"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-acc-phone" className="block text-zinc-300 mb-1 font-medium">
                Phone
              </label>
              <input
                id="new-acc-phone"
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label htmlFor="new-acc-email" className="block text-zinc-300 mb-1 font-medium">
                Email
              </label>
              <input
                id="new-acc-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="debtor@example.com"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-acc-balance" className="block text-zinc-300 mb-1 font-medium">
                Current Balance ($)
              </label>
              <input
                id="new-acc-balance"
                type="number"
                required
                value={form.currentBalance}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  setForm({ ...form, currentBalance: val, originalBalance: val });
                }}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label htmlFor="new-acc-dpd" className="block text-zinc-300 mb-1 font-medium">
                Days Past Due (DPD)
              </label>
              <input
                id="new-acc-dpd"
                type="number"
                required
                value={form.daysPastDue}
                onChange={(e) => setForm({ ...form, daysPastDue: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="new-acc-creditor" className="block text-zinc-300 mb-1 font-medium">
              Original Creditor
            </label>
            <input
              id="new-acc-creditor"
              type="text"
              required
              value={form.originalCreditor}
              onChange={(e) => setForm({ ...form, originalCreditor: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="px-4 py-2 text-zinc-300 rounded-xl font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl font-bold shadow-lg shadow-white/5 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
