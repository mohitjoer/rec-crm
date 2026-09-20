'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingOrAuth = pathname === '/' || pathname.startsWith('/auth');

  if (isLandingOrAuth) {
    return (
      <main className="w-full min-h-screen bg-[#f8f9fa] text-zinc-900 dark:bg-[#09090b] dark:text-zinc-100 transition-colors duration-200">
        {children}
      </main>
    );
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#f8f9fa] text-zinc-900 dark:bg-[#09090b] dark:text-zinc-100 flex flex-col md:flex-row min-w-0 antialiased selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-950 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 md:h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#f8f9fa] dark:bg-[#09090b] transition-colors duration-200">
        <Header />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <main className="px-6 md:px-8 pt-2 pb-8 md:pt-3 md:pb-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
