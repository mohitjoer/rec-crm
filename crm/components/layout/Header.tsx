'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

const ROUTE_LABELS: Record<string, { category: string; title: string }> = {
  '/dashboard': { category: 'Portfolio', title: 'Dashboard' },
  '/accounts': { category: 'Accounts', title: 'Debtor Directory' },
  '/logs': { category: 'Activity', title: 'Call Logs & Transcripts' },
  '/queue': { category: 'Activity', title: 'Queued Calls' },
  '/agent': { category: 'Agent Controls', title: 'Cadence & Rules' },
  '/agent/prompt': { category: 'Agent Controls', title: 'Prompt Editor' },
  '/webhooks': { category: 'Integrations', title: 'Inbound Webhook' },
  '/settings': { category: 'Account & Billing', title: 'Billing & Security' },
};

export default function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();

  const currentRoute = ROUTE_LABELS[pathname] || {
    category: 'Console',
    title: pathname.replace('/', '').toUpperCase() || 'Recovra',
  };

  const isDark = !mounted || theme === 'dark';

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-[#1e1e22] bg-white dark:bg-[#09090b] px-6 md:px-8 flex items-center justify-between gap-3 min-w-0 shrink-0 w-full z-20 transition-colors duration-200 select-none">
      {/* Left: Breadcrumbs / Section Title */}
      <div className="flex min-w-0 items-center gap-2 text-xs">
        <span className="shrink-0 text-zinc-500 dark:text-zinc-400 font-medium">
          {currentRoute.category}
        </span>
        <span className="shrink-0 text-zinc-300 dark:text-zinc-700 font-bold">/</span>
        <span title={currentRoute.title} className="min-w-0 truncate text-zinc-900 dark:text-zinc-100 font-bold tracking-tight text-sm">
          {currentRoute.title}
        </span>
      </div>

      {/* Right: Theme Toggle (Light / Dark) */}
      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={toggleTheme}
          suppressHydrationWarning
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#141416] dark:hover:bg-[#1f1f24] border border-zinc-200 dark:border-[#242428] flex items-center justify-center text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer active:scale-95 shadow-sm"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-700 transition-transform duration-200 -rotate-12 hover:rotate-0" />
          )}
        </button>
      </div>
    </header>
  );
}
