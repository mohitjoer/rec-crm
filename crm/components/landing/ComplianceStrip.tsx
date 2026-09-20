import React from 'react';
import { ShieldCheck, Check, Lock, Landmark, Zap } from 'lucide-react';

export function ComplianceStrip() {
  return (
    <section className="py-6 border-y border-zinc-800/80 bg-zinc-950/60">
      <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-wrap items-center justify-between gap-6 text-zinc-400 text-xs">
        <span className="font-semibold uppercase tracking-wider text-zinc-500 text-[11px]">
          Institutional-Grade Compliance &amp; Standards:
        </span>
        <div className="flex flex-wrap items-center gap-6 md:gap-8 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>DPDP Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-white" />
            <span>TRAI DLT Registered</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-white" />
            <span>FDCPA &amp; TCPA Guard</span>
          </div>
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-white" />
            <span>RBI Aligned Framework</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-white" />
            <span>SOC-2 Type II Ready</span>
          </div>
        </div>
      </div>
    </section>
  );
}
