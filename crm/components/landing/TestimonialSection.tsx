import React from 'react';
import { Quote } from 'lucide-react';

export function TestimonialSection() {
  return (
    <section className="py-16 px-6 md:px-12 bg-zinc-950/80 border-t border-zinc-800/80">
      <div className="max-w-4xl mx-auto p-8 md:p-12 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-6 relative">
        <Quote className="w-10 h-10 text-zinc-700 absolute top-8 right-8" />
        <div className="flex items-center gap-1 text-white text-xs font-semibold">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-white">★</span>
          ))}
          <span className="ml-2 text-zinc-400 font-normal">Verified Customer Feedback</span>
        </div>

        <p className="text-base sm:text-xl text-zinc-200 leading-relaxed font-medium">
          &ldquo;Before Recovra, our finance manager was spending 15 hours a week sending reminder emails and awkward follow-up messages. We turned on autonomous voice and WhatsApp sequences, and our 30-day overdue balance dropped by nearly half within the first three weeks &mdash; without alienating a single customer.&rdquo;
        </p>

        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-white">Kavita Sharma</div>
            <div className="text-zinc-400">Head of Finance &amp; Operations, Nexus Cloud Solutions</div>
          </div>
          <div className="text-right text-zinc-500 font-mono text-[11px]">
            B2B SaaS &bull; 450+ Active Accounts
          </div>
        </div>
      </div>
    </section>
  );
}
