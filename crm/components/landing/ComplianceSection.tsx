'use client';

import React from 'react';
import { ShieldCheck, Clock, Lock, FileText, type LucideIcon, Scale } from 'lucide-react';

interface CompliancePillar {
  title: string;
  desc: string;
  icon: LucideIcon;
}

const COMPLIANCE_PILLARS: CompliancePillar[] = [
  {
    title: 'Statutory Mini-Miranda Disclosures',
    desc: 'The agent identifies itself and delivers mandatory debt collection disclosures before any balance or account details are shared.',
    icon: ShieldCheck,
  },
  {
    title: 'TCPA Calling Window Guardrails',
    desc: 'Outbound telephony calls are strictly constrained to 8:00 AM – 9:00 PM in the debtor’s local time zone, automatically accounting for Daylight Savings.',
    icon: Clock,
  },
  {
    title: 'Cease & Desist / Hardship Freezes',
    desc: 'Any verbal revocation of consent or hardship declaration instantly pauses outreach across all channels and routes the account for supervisor review.',
    icon: Lock,
  },
  {
    title: 'Cryptographic Audit Trail & Transcripts',
    desc: 'Every call session, full audio transcript, and promise-to-pay commitment is timestamped and preserved for legal compliance audits.',
    icon: FileText,
  },
];

export function ComplianceSection() {
  return (
    <section id="compliance" className="py-24 px-6 md:px-12 bg-white dark:bg-[#09090b] border-t border-zinc-200 dark:border-zinc-800/80">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            <Scale className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
            <span>Governance &amp; Regulatory Defense</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-tight">
            Compliance built directly into the voice agent runtime.
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Financial recovery is heavily regulated. Recovra enforces FDCPA, TCPA, and CFPB Reg F guidelines directly inside the execution loop rather than relying on retrospective audits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {COMPLIANCE_PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors space-y-3 shadow-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">{item.title}</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
