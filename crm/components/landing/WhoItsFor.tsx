import React from 'react';
import { Building2, Landmark, RefreshCw, HeartPulse, type LucideIcon } from 'lucide-react';

interface WorkflowItem {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
}

const WORKFLOWS: WorkflowItem[] = [
  {
    title: 'B2B SaaS & Enterprise Services',
    subtitle: 'Overdue Invoices & Net-30/60 Terms',
    description:
      'Eliminate manual "just checking in" emails. Trigger polite pre-due and post-due multi-channel reminders, attach invoices automatically, and flag disputed line items directly to your billing lead.',
    icon: Building2,
  },
  {
    title: 'FinTech & Consumer Lending',
    subtitle: 'Early-Bucket EMI & Installment Recovery',
    description:
      'Execute high-volume day 1–30 DPD outreach with sub-second voice AI. The agent verifies identity, handles balance negotiations, structures PTPs, and sends instant payment links.',
    icon: Landmark,
  },
  {
    title: 'Subscription & Recurring Platforms',
    subtitle: 'Failed Payment Dunning & Churn Mitigation',
    description:
      'When credit cards decline or mandates fail, trigger immediate multi-channel recovery before the subscriber cancels or falls into unrecoverable delinquency.',
    icon: RefreshCw,
  },
  {
    title: 'Healthcare & Patient Accounting',
    subtitle: 'Compassionate Out-of-Pocket Balance Resolution',
    description:
      'Conduct sensitive, compliant conversations regarding medical balances, explaining payment options and offering interest-free monthly installment structures.',
    icon: HeartPulse,
  },
];

export function WhoItsFor() {
  return (
    <section id="workflows" className="py-24 px-6 md:px-12 bg-zinc-950/70 border-t border-zinc-800/80">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="max-w-3xl space-y-4">
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">Workflows &amp; Use Cases</p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight leading-tight">
            Tailored recovery workflows for finance teams who want to get paid on time.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            From single overdue invoices to thousands of monthly consumer EMIs, Recovra standardizes your best collection playbook into an autonomous loop.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {WORKFLOWS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-tight">{item.title}</h3>
                    <p className="text-xs text-zinc-400 font-medium mt-0.5">{item.subtitle}</p>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed pt-1">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
