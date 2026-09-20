'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';
import {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  Settings,
  LogOut,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Sliders,
  Sparkles,
  Webhook,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const SECTIONS: SidebarSection[] = [
  {
    title: 'DISCOVER',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Debtor Accounts', href: '/accounts', icon: Users },
    ]
  },
  {
    title: 'ACTIVITY',
    items: [
      { label: 'Call Logs', href: '/logs', icon: FileText },
      { label: 'Queued Calls', href: '/queue', icon: Clock },
    ]
  },
  {
    title: 'AGENT CONTROLS',
    items: [
      { label: 'Agent Cadence & Rules', href: '/agent', icon: Sliders },
      { label: 'Agent Prompt', href: '/agent/prompt', icon: Sparkles },
    ]
  },
  {
    title: 'INTEGRATIONS',
    items: [
      { label: 'Inbound Webhook', href: '/webhooks', icon: Webhook },
    ]
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('recovra-sidebar-minimized');
      if (saved === 'true') {
        setIsMinimized(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  // Persist sidebar state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('recovra-sidebar-minimized', String(isMinimized));
    } catch {
      // ignore
    }
  }, [isMinimized]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // ignore
    }
    router.replace('/auth/sign-in');
  };

  return (
    <>
      {/* Mobile Navigation */}
      <nav aria-label="Mobile navigation" className="flex min-w-0 shrink-0 flex-wrap items-center gap-1 border-b border-zinc-200 bg-white p-2 dark:border-[#1e1e22] dark:bg-[#09090b] md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1 mr-1 hover:opacity-85 transition-opacity">
          <Image
            src="/icon_logo_dark.png"
            alt="Recovra Icon"
            width={22}
            height={22}
            className="w-5.5 h-5.5 object-contain dark:hidden shrink-0"
          />
          <Image
            src="/icon_logo.png"
            alt="Recovra Icon"
            width={22}
            height={22}
            className="w-5.5 h-5.5 object-contain hidden dark:block shrink-0"
          />
          <span className="text-xs font-bold text-zinc-900 dark:text-white tracking-tight">Recovra</span>
        </Link>
        {SECTIONS.flatMap((section) => section.items).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? 'page' : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-medium ${
              pathname === item.href
                ? 'bg-zinc-900 text-white dark:bg-[#1c1c20]'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-[#141417]'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
        <Link
          href="/settings"
          aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
          className={`flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-medium ${
            pathname.startsWith('/settings')
              ? 'bg-zinc-900 text-white dark:bg-[#1c1c20]'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-[#141417]'
          }`}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-[#141417]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </nav>

      {/* Desktop Responsive Sidebar */}
      <aside
        className={`${
          isMinimized ? 'w-16' : 'w-52'
        } h-[100dvh] max-h-[100dvh] sticky top-0 bg-white dark:bg-[#09090b] border-r border-zinc-200 dark:border-[#1e1e22] flex flex-col justify-between hidden md:flex shrink-0 select-none overflow-hidden transition-all duration-200 ease-in-out`}
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          {/* Workspace Brand Header & Toggle Button */}
          {isMinimized ? (
            <div className="p-2.5 pb-2 shrink-0 flex flex-col items-center gap-2">
              <Link
                href="/dashboard"
                title="Recovra Workspace"
                className="w-9 h-9 flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/icon_logo_dark.png"
                  alt="Recovra Icon"
                  width={28}
                  height={28}
                  priority
                  className="w-7 h-7 object-contain dark:hidden"
                />
                <Image
                  src="/icon_logo.png"
                  alt="Recovra Icon"
                  width={28}
                  height={28}
                  priority
                  className="w-7 h-7 object-contain hidden dark:block"
                />
              </Link>
              <button
                onClick={toggleMinimize}
                aria-label="Expand sidebar"
                title="Expand sidebar"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-[#18181b] transition-colors cursor-pointer"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-3 pb-2 shrink-0">
              <div className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-100/80 dark:bg-[#141416] border border-zinc-200 dark:border-[#242428] flex items-center justify-between transition-colors">
                <Link href="/dashboard" className="flex items-center gap-2 min-w-0 group hover:opacity-85 transition-opacity">
                  <Image
                    src="/icon_logo_dark.png"
                    alt="Recovra Icon"
                    width={22}
                    height={22}
                    priority
                    className="w-5 h-5 object-contain dark:hidden shrink-0"
                  />
                  <Image
                    src="/icon_logo.png"
                    alt="Recovra Icon"
                    width={22}
                    height={22}
                    priority
                    className="w-5 h-5 object-contain hidden dark:block shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white tracking-tight truncate flex items-center gap-1">
                      Recovra
                      <span className="text-[9px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1 py-0.2 rounded">AI</span>
                    </span>
                    <span className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate">
                      Enterprise
                    </span>
                  </div>
                </Link>
                <button
                  onClick={toggleMinimize}
                  aria-label="Minimize sidebar"
                  title="Minimize sidebar"
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 dark:hover:text-zinc-200 dark:hover:bg-[#1e1e24] transition-colors cursor-pointer"
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Section Navigation Groups */}
          <div className={`${isMinimized ? 'px-1.5 py-2.5 space-y-2.5' : 'px-2 py-2 space-y-5'} flex-1`}>
            {SECTIONS.map((section, idx) => (
              <div key={section.title} className="space-y-0.5">
                {isMinimized ? (
                  idx > 0 && <div className="border-t border-zinc-200 dark:border-zinc-800/80 my-2 mx-1" />
                ) : (
                  <div className="px-2.5 text-[9.5px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
                    {section.title}
                  </div>
                )}
                <div className="space-y-0.5 pt-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    if (isMinimized) {
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={item.label}
                          aria-label={item.label}
                          className={`flex items-center justify-center w-9 h-9 mx-auto rounded-lg transition-all ${
                            isActive
                              ? 'bg-zinc-900 text-white shadow-xs dark:bg-[#1c1c20] dark:text-white'
                              : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-[#141417]'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`} />
                        </Link>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-zinc-900 text-white shadow-xs font-semibold dark:bg-[#1c1c20] dark:text-white'
                            : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-[#141417]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 truncate">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Profile Bar at Bottom */}
        {isMinimized ? (
          <div className="p-2.5 border-t border-zinc-200 dark:border-[#1e1e22] flex flex-col items-center gap-2 shrink-0 bg-white dark:bg-[#09090b] transition-colors">
            <div
              title={`${session?.user?.name || 'Account Profile'} (${session?.user?.email || 'Recovery Officer'})`}
              className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#2a2a2e] flex items-center justify-center text-zinc-700 dark:text-zinc-300"
            >
              <User className="w-3.5 h-3.5" />
            </div>
            <Link
              href="/settings"
              aria-label="Settings"
              title="Settings"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                pathname.startsWith('/settings')
                  ? 'text-zinc-950 bg-zinc-100 dark:text-white dark:bg-[#18181b]'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#18181b]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-[#18181b] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="p-2.5 border-t border-zinc-200 dark:border-[#1e1e22] flex items-center justify-between shrink-0 bg-white dark:bg-[#09090b] transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#2a2a2e] flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
                <User className="w-3 h-3" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-200 truncate">
                  {session?.user?.name || 'Profile'}
                </div>
                <div className="text-[9px] text-zinc-500 truncate">
                  {session?.user?.email || 'Recovery Officer'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <Link
                href="/settings"
                aria-label="Settings"
                title="Settings"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  pathname.startsWith('/settings')
                    ? 'text-zinc-950 bg-zinc-100 dark:text-white dark:bg-[#18181b]'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#18181b]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                title="Sign out"
                className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-[#18181b] transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
