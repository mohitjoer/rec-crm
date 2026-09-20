'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

export interface LandingNavProps {
  onOpenDemoModal?: () => void;
}

const NAV_LINKS = [
  { href: '#platform', label: 'Platform' },
  { href: '#simulator', label: 'Simulator' },
  { href: '#architecture', label: 'How It Works' },
  { href: '#comparison', label: 'Comparison' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#compliance', label: 'Compliance' },
  { href: '#faq', label: 'FAQ' },
];

export function LandingNav({ onOpenDemoModal }: LandingNavProps) {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md px-6 md:px-12 flex items-center justify-between sticky top-0 z-50 transition-colors duration-200">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center hover:opacity-85 transition-opacity">
          <Image
            src="/full_logo_dark.png"
            alt="Recovra AI Logo"
            width={120}
            height={40}
            priority
            className="h-7 w-auto object-contain dark:hidden"
          />
          <Image
            src="/full_logo.png"
            alt="Recovra AI Logo"
            width={120}
            height={40}
            priority
            className="h-7 w-auto object-contain hidden dark:block"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle Button (Icon only per rule) */}
        <button
          onClick={toggleTheme}
          suppressHydrationWarning
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer active:scale-95 shadow-xs"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 transition-transform duration-200 rotate-0 hover:rotate-45" />
          ) : (
            <Moon className="w-3.5 h-3.5 transition-transform duration-200 -rotate-12 hover:rotate-0 text-zinc-800" />
          )}
        </button>

        <Link
          href="/dashboard"
          className="text-xs text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white px-3.5 py-1.5 rounded-full border border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-900/50 transition-colors hidden sm:inline-flex items-center"
        >
          Dashboard
        </Link>
        <button
          onClick={onOpenDemoModal}
          className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-xs transition-colors cursor-pointer"
        >
          <span>Book demo</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
