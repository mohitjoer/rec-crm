'use client';

import React from 'react';
import { X } from 'lucide-react';
import { CallRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface CallAuditModalProps {
  call: CallRecord;
  onClose: () => void;
}

export function CallAuditModal({ call, onClose }: CallAuditModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {call.id}
            </span>
            <h2 className="text-base font-bold text-white mt-1">
              Call Audit: {call.debtorName} ({call.accountId})
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close call audit"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Call Metrics Summary */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Disposition</span>
            <div className="font-bold text-white mt-0.5">{call.disposition.replace(/_/g, ' ')}</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Compliance</span>
            <div className="font-bold text-white mt-0.5">{call.complianceScore}% Passed</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Call Duration</span>
            <div className="font-bold text-white mt-0.5">
              {Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300">
          <strong className="text-white">AI Summary: </strong>
          {call.summary}
        </div>

        {/* Transcript Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 border border-zinc-800 rounded-xl p-4 bg-zinc-950">
          <div className="text-[11px] font-bold text-zinc-400 uppercase">Verbatim Voice Session Transcript:</div>
          {call.transcript.map((t) => (
            <div key={t.id} className="text-xs space-y-0.5">
              <div className="flex items-center gap-2">
                <span className={`font-bold ${t.speaker === 'agent' ? 'text-white' : 'text-zinc-300'}`}>
                  {t.speaker === 'agent' ? 'Recovery Specialist (Sarah)' : call.debtorName}
                </span>
                <span className="text-[10px] text-zinc-400">{t.timestamp}</span>
              </div>
              <p className="text-zinc-200 pl-2 border-l border-zinc-800">{t.text}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={onClose}
            variant="secondary"
            className="px-4 py-2 text-zinc-200 text-xs font-semibold rounded-xl"
          >
            Close Audit
          </Button>
        </div>
      </div>
    </div>
  );
}
