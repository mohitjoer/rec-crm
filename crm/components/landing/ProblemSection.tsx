import React from 'react';

const PAIN_POINTS = [
  {
    title: 'Follow-ups pile up',
    desc: 'Overdue invoices grow faster than reps can manually dial and document.',
  },
  {
    title: 'Negotiations stall',
    desc: 'Borrowers want split plans or discounts while reps wait for approvals.',
  },
  {
    title: 'Agents start cold',
    desc: 'Dispute notes and payment context get lost across disparate spreadsheets.',
  },
  {
    title: 'Compliance risk compounds',
    desc: 'Rushed manual calls risk statutory disclosure and calling window errors.',
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 px-6 md:px-12 bg-zinc-950/60 border-t border-zinc-800/80">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="max-w-2xl space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">The Problem</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Reminders got automated. Recovery still runs at human speed.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PAIN_POINTS.map((item) => (
            <div
              key={item.title}
              className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
            >
              <h3 className="text-sm font-semibold text-white tracking-tight mb-1.5">{item.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
