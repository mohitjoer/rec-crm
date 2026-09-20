'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface EarlyAccessSectionProps {
  onOpenDemoModal?: () => void;
}

export function EarlyAccessSection({ onOpenDemoModal }: EarlyAccessSectionProps) {
  return (
    <section className="py-24 px-6 md:px-12 bg-[#09090b] border-t border-zinc-800/80 text-center">
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
          Connect the loop from delinquency to recovery.
        </h2>
        <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
          Deploy autonomous voice agents that negotiate payments and log commitments directly to your ledger.
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Button
            size="lg"
            variant="default"
            onClick={onOpenDemoModal}
            className="rounded-full px-6 h-10 text-xs font-semibold cursor-pointer"
          >
            <span>Book demo</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-zinc-950" />
          </Button>
          <Link
            href="/dashboard"
            className="text-xs text-zinc-300 hover:text-white px-5 py-2.5 rounded-full border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 transition-colors"
          >
            Launch Console
          </Link>
        </div>
      </div>
    </section>
  );
}
