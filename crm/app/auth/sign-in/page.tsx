'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, Lock, Mail, Building2, AlertCircle } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('Recovra (Enterprise)');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      const res = await authClient.signIn.email({
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message || 'Invalid email or password.');
        setIsPending(false);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-6 shadow-xl dark:shadow-2xl dark:shadow-black transition-colors">
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="inline-block hover:opacity-85 transition-opacity pb-1">
            <Image
              src="/full_logo_dark.png"
              alt="Recovra AI Logo"
              width={140}
              height={42}
              priority
              className="h-9 w-auto object-contain dark:hidden"
            />
            <Image
              src="/full_logo.png"
              alt="Recovra AI Logo"
              width={140}
              height={42}
              priority
              className="h-9 w-auto object-contain hidden dark:block"
            />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Sign in to Recovra</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Enterprise Voice Recovery &amp; Debt Resolution SaaS</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="auth-org-select" className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Organization Workspace
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3" />
              <select
                id="auth-org-select"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500 transition-colors"
              >
                <option value="Recovra (Enterprise)">Recovra (Enterprise)</option>
                <option value="Cascade Recovery Group (Growth)">Cascade Recovery Group (Growth)</option>
                <option value="Veritas Global Solutions">Veritas Global Solutions</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="auth-email-input" className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3" />
              <input
                id="auth-email-input"
                type="email"
                required
                placeholder="officer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password-input" className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3" />
              <input
                id="auth-password-input"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            <span>{isPending ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-4 h-4 text-white dark:text-zinc-950" />
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2 transition-colors">
          <div>
            Don&apos;t have an account?{' '}
            <Link href="/auth/sign-up" className="text-zinc-900 dark:text-white font-semibold hover:underline">
              Create account
            </Link>
          </div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Identity &amp; Tenant Isolation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
