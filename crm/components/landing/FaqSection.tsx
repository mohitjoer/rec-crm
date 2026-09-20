'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'How does Recovra guarantee FDCPA and TCPA legal compliance?',
    answer:
      'Compliance is hardcoded into the conversational state machine. The voice agent automatically delivers the required statutory Mini-Miranda disclosures before any account balance details are shared. Furthermore, all calls are time-zone locked between 8:00 AM and 9:00 PM local debtor time, and the system algorithmically caps call frequency according to CFPB Reg F (7-in-7) rules. Any verbal dispute or cease-and-desist request triggers an immediate freeze.',
  },
  {
    question: 'Does the voice agent sound like a robotic IVR or a natural human specialist?',
    answer:
      'Recovra utilizes an ultra-low latency voice pipeline (sub-250ms turn latency) that speaks with natural conversational cadences, empathetic inflection, and intelligent pause handling. Borrowers frequently converse naturally without noticing artificial delays, leading to an average 41.2% Promise-to-Pay (PTP) commitment rate.',
  },
  {
    question: 'Can human recovery officers listen in or intervene on live calls?',
    answer:
      'Yes. Through the Recovra Operations Console, recovery supervisors have real-time visibility into active calls, complete with streaming transcripts, sentiment metrics, and audio visualizers. Supervisors can choose to silently monitor, whisper coaching cues into the session, or take over the call with a single click.',
  },
  {
    question: 'How does Recovra integrate with our existing billing and CRM systems?',
    answer:
      'Recovra features native connectors for leading financial platforms including Stripe, QuickBooks, Xero, Salesforce, and custom REST API/webhook endpoints. You can ingest delinquent accounts via automated scheduled API sync or upload encrypted CSV files. When payments or promises-to-pay occur, your ledger updates in real time.',
  },
  {
    question: 'What happens when a debtor requests a settlement or claims financial hardship?',
    answer:
      'Settlement negotiation boundaries are configured by your risk team (e.g., maximum 15% discount for same-day settlement, or structured 3-month split installments). If a borrower mentions an emergency or financial hardship, the agent is programmed to handle it with empathy and automatically flag a 30-day temporary hold for internal review.',
  },
  {
    question: 'How fast can our team go live with Recovra?',
    answer:
      'Most mid-market lending and SaaS teams are fully integrated within 3 business days. Telephony SIP trunks and inbound/outbound caller IDs can be provisioned in minutes, and our compliance templates come pre-configured out of the box.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 px-6 md:px-12 bg-white dark:bg-[#09090b] border-t border-zinc-200 dark:border-zinc-800/80">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Everything you need to know about Recovra.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Detailed answers on compliance, voice technology, integration workflows, and risk guardrails.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/30 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <span className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-zinc-900 dark:text-white' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-200/50 dark:border-zinc-800/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
