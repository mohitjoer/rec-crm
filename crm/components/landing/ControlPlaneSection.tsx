import React from 'react';
import { Database, PhoneCall, ShieldCheck, SlidersHorizontal, type LucideIcon } from 'lucide-react';

interface CapabilityItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const CAPABILITIES: CapabilityItem[] = [
  {
    icon: Database,
    title: 'Shared context layer',
    description: 'Every invoice, note, and prior promise-to-pay flows into one queryable ledger so agents start informed.',
  },
  {
    icon: PhoneCall,
    title: 'Voice agent orchestration',
    description: 'Natural two-way voice conversations that handle objections, structure plans, and send payment links.',
  },
  {
    icon: ShieldCheck,
    title: 'Verification in the loop',
    description: 'Mini-Miranda disclosures and TCPA calling windows enforced directly inside the agent loop.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Control without slowing down',
    description: 'Humans stay in control of policy and exceptions; AI handles the repetitive daily follow-ups.',
  },
];

export function ControlPlaneSection() {
  return (
    <section id="platform" className="py-20 px-6 md:px-12 bg-[#09090b] border-t border-zinc-800/80">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="max-w-2xl space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">Platform</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            The control plane for autonomous recovery.
          </h2>
          <p className="text-xs text-zinc-400">
            Coordinates work across ledgers, voice agents, and your finance team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 hover:border-zinc-750 transition-colors space-y-3"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">{cap.title}</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{cap.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
