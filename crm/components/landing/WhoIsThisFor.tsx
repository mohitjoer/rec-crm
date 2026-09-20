import React from 'react';

export function WhoIsThisFor() {
  return (
    <section className="py-20 px-6 md:px-12 max-w-4xl mx-auto text-center space-y-6">
      <div className="inline-block">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
          Who Is This For
        </span>
      </div>
      <p className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-tight leading-relaxed max-w-3xl mx-auto">
        &ldquo;Built for finance teams and founders who are tired of chasing people for money that&rsquo;s already owed to them &mdash; without hiring a collections team or sounding like a debt collector.&rdquo;
      </p>
      <p className="text-sm text-zinc-400 max-w-xl mx-auto">
        Maintain respectful debtor relationships while systematically eliminating outstanding receivables.
      </p>
    </section>
  );
}
