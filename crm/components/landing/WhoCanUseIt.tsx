import React from 'react';
import { Building2, Landmark, Briefcase, RefreshCw, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function WhoCanUseIt() {
  return (
    <section id="who-can-use-it" className="py-20 px-6 md:px-12 bg-zinc-950/80 border-t border-zinc-800/80">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tailored Segments</h2>
          <p className="text-3xl font-bold text-white tracking-tight">Who Can Use Recovra</p>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            Whether you are recovering enterprise invoices or retail consumer credit, our autonomous agents adapt to your cadence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Startups & B2B SaaS */}
          <div className="p-8 rounded-3xl bg-zinc-900/90 border-2 border-white/20 hover:border-white transition-colors space-y-4 relative group shadow-xl">
            <Badge variant="default">
              Enterprise &amp; Growth
            </Badge>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Startups &amp; B2B SaaS</h3>
                <span className="text-xs text-zinc-400">Recurring Invoicing &amp; Enterprise Accounts</span>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed font-medium">
              &ldquo;Stop sending awkward &lsquo;just following up&rsquo; emails. Automate invoice reminders before and after due dates.&rdquo;
            </p>
            <ul className="space-y-2 text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white" /> Pre-due gentle nudges &amp; payment link delivery</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white" /> Escalated voice outreach after payment term lapses</li>
            </ul>
          </div>

          {/* Card 2: NBFCs & Lenders */}
          <div className="p-8 rounded-3xl bg-zinc-900/90 border-2 border-white/20 hover:border-white transition-colors space-y-4 relative group shadow-xl">
            <Badge variant="default">
              Primary Launch Focus
            </Badge>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
                <Landmark className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">NBFCs &amp; Lenders</h3>
                <span className="text-xs text-zinc-400">Consumer &amp; Commercial Loans</span>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed font-medium">
              &ldquo;Compliant, RBI-aligned EMI reminders and early-stage recovery calls at scale.&rdquo;
            </p>
            <ul className="space-y-2 text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white" /> Automated DPD 1-30 empathetic early recovery</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white" /> Dynamic negotiation of installments &amp; hardship holds</li>
            </ul>
          </div>

          {/* Card 3: Freelancers & Agencies */}
          <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Freelancers &amp; Agencies</h3>
                <span className="text-xs text-zinc-400">Client Service Retainers &amp; Milestones</span>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              &ldquo;Get paid on time without the uncomfortable follow-up conversation.&rdquo;
            </p>
            <ul className="space-y-2 text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white" /> Keep founder-client rapport clean and positive</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white" /> Direct digital payment link sent via WhatsApp &amp; SMS</li>
            </ul>
          </div>

          {/* Card 4: Subscription Businesses */}
          <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Subscription Businesses</h3>
                <span className="text-xs text-zinc-400">Membership &amp; Recurring Billing</span>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              &ldquo;Reduce failed-payment churn with automated dunning calls and messages.&rdquo;
            </p>
            <ul className="space-y-2 text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white" /> Immediate smart outreach on card authorization decline</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-white" /> Frictionless payment method re-authentication</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
