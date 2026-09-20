import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export function WorkReduced() {
  return (
    <section id="reduction" className="py-20 px-6 md:px-12 bg-zinc-950/90 border-t border-zinc-800/80">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Impact &amp; Efficiency</h2>
          <p className="text-3xl font-bold text-white tracking-tight">How Much Work Is Reduced</p>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            Replace disjointed spreadsheets and repetitive call scripts with an autonomous engine that never misses a due date.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Before Card */}
          <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-zinc-400" />
                </div>
                <span className="font-bold text-base text-zinc-300">Before Recovra</span>
              </div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Manual &amp; Fragile</span>
            </div>

            <ul className="space-y-4 text-xs text-zinc-400">
              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <span><strong>Manual calls &amp; messages sent one by one:</strong> Finance staff spends half their day copy-pasting numbers and retyping emails.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <span><strong>Follow-ups missed or delayed:</strong> Overdue accounts sit unnoticed for weeks until cashflow shortages become critical.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <span><strong>No centralized record of promises-to-pay:</strong> Verbal commitments get lost on sticky notes and siloed inbox threads.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <span><strong>Dedicated headcount needed just for follow-ups:</strong> Hiring and training collectors who burn out quickly on repetitive tasks.</span>
              </li>
            </ul>
          </div>

          {/* After Card */}
          <div className="p-8 rounded-3xl bg-zinc-900 border-2 border-white space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white text-zinc-950 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                </div>
                <span className="font-bold text-base text-white">After Recovra</span>
              </div>
              <span className="text-[11px] uppercase tracking-wider text-white font-bold bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-700">
                Autonomous
              </span>
            </div>

            <ul className="space-y-4 text-xs text-zinc-200">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span><strong>Automated sequences trigger on due dates:</strong> Scheduled voice, WhatsApp, and SMS sequences initiate without any manual intervention.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span><strong>Every debtor contacted on time, every time:</strong> Consistent, empathetic outreach guarantees zero delinquency blindspots.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span><strong>Every conversation logged automatically:</strong> Verbatim audio, AI summary, agreed payment dates, and payment links recorded instantly.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span><strong>One person oversees what used to need a team:</strong> Manage thousands of accounts from a single command dashboard.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
