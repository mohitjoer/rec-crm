'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function LandingFooter() {
  return (
    <footer className="py-14 px-6 md:px-12 border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#09090b] text-xs text-zinc-500">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center hover:opacity-85 transition-opacity">
            <Image
              src="/full_logo_dark.png"
              alt="Recovra AI Logo"
              width={96}
              height={32}
              className="h-5.5 w-auto object-contain dark:hidden"
            />
            <Image
              src="/full_logo.png"
              alt="Recovra AI Logo"
              width={96}
              height={32}
              className="h-5.5 w-auto object-contain hidden dark:block"
            />
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
          <span className="text-zinc-500 dark:text-zinc-400">Collections that run themselves.</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
          <a href="#platform" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Platform</a>
          <a href="#simulator" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Simulator</a>
          <a href="#architecture" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Architecture</a>
          <a href="#comparison" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Comparison</a>
          <a href="#pricing" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Pricing</a>
          <a href="#compliance" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Compliance</a>
          <a href="#faq" className="hover:text-zinc-950 dark:hover:text-white transition-colors">FAQ</a>
          <Link href="/dashboard" className="text-zinc-900 dark:text-zinc-200 font-semibold hover:underline">
            Dashboard
          </Link>
          <Link href="/auth/sign-in" className="hover:text-zinc-950 dark:hover:text-white transition-colors">
            Sign In
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-8 mt-8 border-t border-zinc-200/80 dark:border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
        <div>&copy; {new Date().getFullYear()} Recovra, Inc. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>All Systems Operational (99.99%)</span>
          </div>
          <span>&bull;</span>
          <span>FDCPA &amp; TCPA Compliant Architecture</span>
          <span>&bull;</span>
          <span>256-Bit TLS Encryption</span>
        </div>
      </div>
    </footer>
  );
}
