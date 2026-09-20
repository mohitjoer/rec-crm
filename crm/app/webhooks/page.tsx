'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useSWR, { mutate } from 'swr';
import {
  Copy,
  Check,
  RotateCcw,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Code2,
  Clock,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  X,
  FileJson,
  Radio,
  FileCode,
  Layers,
  ArrowRight,
  Database,
  Trash2,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { WebhookLog } from '@/lib/types';

interface WebhookApiResponse {
  webhookUrl: string;
  webhookKey: string;
  logs: WebhookLog[];
  totalReceived: number;
  lastReceivedAt: string | null;
}

export default function WebhooksPage() {
  const { data, isLoading, isValidating } = useSWR<WebhookApiResponse>('/api/webhooks', fetcher, {
    revalidateOnFocus: false,
  });

  const [showSecret, setShowSecret] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [isRollingKey, setIsRollingKey] = useState(false);
  const [showRollConfirm, setShowRollConfirm] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<'deliveries' | 'quickstart' | 'schema'>('deliveries');
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'node' | 'python'>('curl');
  const [inspectLog, setInspectLog] = useState<WebhookLog | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyToClipboard = (text: string, setFn: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  const handleRollKey = async () => {
    setIsRollingKey(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate_key' }),
      });
      if (res.ok) {
        await mutate('/api/webhooks');
        setShowRollConfirm(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to roll secret key');
    } finally {
      setIsRollingKey(false);
    }
  };

  const webhookUrl = data?.webhookUrl || 'https://recovra.com/api/webhooks/incoming';
  const webhookKey = data?.webhookKey || 'whsec_live_••••••••••••••••••••••••••••••••';

  const snippets = {
    curl: `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${webhookKey}" \\
  -d '{
    "metadata": {
      "userId": "usr_99214"
    },
    "name": "Sarah Connor",
    "email": "sarah.connor@cyberdyne.io",
    "phoneNumber": "+1-555-382-9912",
    "country": "US",
    "overdueAmount": 1250.00,
    "predueAmount": 300.00,
    "notes": "Late payment for invoice INV-2026-882"
  }'`,
    node: `// Inbound Debtor Ingestion & Zero-Balance Removal via Node.js
const response = await fetch("${webhookUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${webhookKey}"
  },
  body: JSON.stringify({
    metadata: {
      userId: "usr_99214"
    },
    name: "Sarah Connor",
    email: "sarah.connor@cyberdyne.io",
    phoneNumber: "+1-555-382-9912",
    country: "US",
    overdueAmount: 1250.00,
    predueAmount: 300.00,
    notes: "Late payment for invoice INV-2026-882"
  })
});

const data = await response.json();
console.log("Ingestion result:", data);`,
    python: `import requests

url = "${webhookUrl}"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer ${webhookKey}"
}
payload = {
    "metadata": {
        "userId": "usr_99214"
    },
    "name": "Sarah Connor",
    "email": "sarah.connor@cyberdyne.io",
    "phoneNumber": "+1-555-382-9912",
    "country": "US",
    "overdueAmount": 1250.00,
    "predueAmount": 300.00,
    "notes": "Late payment for invoice INV-2026-882"
}

response = requests.post(url, json=payload, headers=headers)
print("Status:", response.status_code)
print(response.json())`,
  };

  const schemaFields = [
    {
      name: 'metadata.userId',
      type: 'string',
      required: 'Optional (Recommended)',
      description: 'Your platform’s unique user ID. Used as primary key to match and update existing debtor records.',
    },
    {
      name: 'name',
      type: 'string',
      required: 'Required',
      description: 'Full name of the client or debtor used in conversational AI outreach.',
    },
    {
      name: 'phoneNumber',
      type: 'string',
      required: 'Required',
      description: 'E.164 format telephone number (e.g. +14155552671) for automated voice calls.',
    },
    {
      name: 'email',
      type: 'string',
      required: 'Optional',
      description: 'Debtor email address for automated post-call settlement outreach and payment links.',
    },
    {
      name: 'overdueAmount',
      type: 'number',
      required: 'Required',
      description: 'Currently delinquent balance. If both overdue and pre-due amounts are 0.00, the account is settled and purged.',
    },
    {
      name: 'predueAmount',
      type: 'number',
      required: 'Optional',
      description: 'Upcoming scheduled or pre-due balance (defaults to 0.00 if omitted).',
    },
    {
      name: 'country',
      type: 'string',
      required: 'Optional',
      description: 'ISO country code (e.g. "US", "GB") or country name for calling window compliance.',
    },
    {
      name: 'notes',
      type: 'string',
      required: 'Optional',
      description: 'Contextual debt reason, invoice number, or loan history provided to the voice agent.',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Inbound Webhook Gateway
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time debtor synchronization. Ingest client balances, trigger autonomous voice outreach, and remove settled accounts.
          </p>
        </div>

        {/* Status indicator & Refresh */}
        <div className="flex items-center gap-3">
        
          <button
            type="button"
            onClick={() => mutate('/api/webhooks')}
            disabled={isValidating}
            className="p-2 rounded-lg border border-zinc-200 dark:border-[#242428] bg-white dark:bg-[#141416] hover:bg-zinc-100 dark:hover:bg-[#1c1c20] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Endpoint & Secret Key Box (Stripe/Resend Style) */}
      <div className="rounded-xl border border-zinc-200 dark:border-[#1e1e22] bg-white dark:bg-[#0c0c0e] divide-y divide-zinc-200 dark:divide-[#1e1e22] overflow-hidden shadow-xs">
        {/* URL Row */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950">
                POST
              </span>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Webhook Ingestion Endpoint
              </span>
            </div>
            <div className="font-mono text-xs text-zinc-900 dark:text-zinc-100 truncate selection:bg-zinc-200 dark:selection:bg-zinc-800">
              {webhookUrl}
            </div>
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard(webhookUrl, setCopiedUrl)}
            className="self-start sm:self-center shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#242428] bg-zinc-50 dark:bg-[#141416] hover:bg-zinc-100 dark:hover:bg-[#1e1e22] text-zinc-700 dark:text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy URL</span>
              </>
            )}
          </button>
        </div>

        {/* Secret Key Row */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-[#09090b]/50">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Signing Secret (Bearer Key)
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                header: Authorization: Bearer &lt;key&gt;
              </span>
            </div>
            <div className="font-mono text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span className="truncate">
                {showSecret ? webhookKey : 'whsec_live_••••••••••••••••••••••••••••••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                title={showSecret ? 'Hide secret' : 'Reveal secret'}
              >
                {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => copyToClipboard(webhookKey, setCopiedKey)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#242428] bg-white dark:bg-[#141416] hover:bg-zinc-100 dark:hover:bg-[#1e1e22] text-zinc-700 dark:text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
            >
              {copiedKey ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy Key</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowRollConfirm(true)}
              className="px-2.5 py-1.5 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-[#242428] text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Rotate Key
            </button>
          </div>
        </div>

        {/* Rotate Confirmation Bar */}
        {showRollConfirm && (
          <div className="p-4 bg-red-50/50 dark:bg-red-950/20 border-t border-red-200 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-red-900 dark:text-red-300">
                Rotate Webhook Signing Key?
              </span>
              <p className="text-red-700 dark:text-red-400 text-[11px]">
                External backend calls using your current key will immediately be rejected until updated.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowRollConfirm(false)}
                className="px-3 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-medium hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRollingKey}
                onClick={handleRollKey}
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isRollingKey && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Rotate Secret</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Segmented View Switcher */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#1e1e22] pb-0">
        <div className="flex items-center gap-1 -mb-px">
          <button
            type="button"
            onClick={() => setActiveNavTab('deliveries')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeNavTab === 'deliveries'
                ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Deliveries</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-zinc-100 dark:bg-[#1e1e22] text-zinc-600 dark:text-zinc-400">
              {data?.logs?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNavTab('quickstart')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeNavTab === 'quickstart'
                ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>API Quickstart</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNavTab('schema')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeNavTab === 'schema'
                ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Schema Reference</span>
          </button>
        </div>

        {activeNavTab === 'deliveries' && data?.lastReceivedAt && (
          <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
            Last event: {new Date(data.lastReceivedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* TAB 1: Deliveries Audit Log Table */}
      {activeNavTab === 'deliveries' && (
        <div className="rounded-xl border border-zinc-200 dark:border-[#1e1e22] bg-white dark:bg-[#0c0c0e] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-[#1e1e22] uppercase tracking-wider bg-zinc-50/80 dark:bg-[#111114]">
                <tr>
                  <th className="py-3 pl-4">Status</th>
                  <th className="py-3">Action</th>
                  <th className="py-3">Client / Debtor</th>
                  <th className="py-3">Platform User ID</th>
                  <th className="py-3">Country</th>
                  <th className="py-3">Overdue</th>
                  <th className="py-3">Pre-Due</th>
                  <th className="py-3">Timestamp</th>
                  <th className="py-3 pr-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-[#1e1e22] text-zinc-700 dark:text-zinc-300 font-sans">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <Loader2 className="w-5 h-5 text-zinc-400 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : !data?.logs || data.logs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-zinc-400">
                      <Terminal className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2 opacity-60" />
                      <p className="font-semibold text-zinc-700 dark:text-zinc-200 text-xs">
                        No webhook deliveries recorded yet
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-1 max-w-sm mx-auto">
                        Send a POST payload from your platform using the Quickstart guide above to verify integration.
                      </p>
                    </td>
                  </tr>
                ) : (
                  data.logs.map((log) => {
                    const payloadUserId =
                      log.payload?.metadata?.userId ||
                      log.payload?.metadata?.user_id ||
                      log.payload?.externalUserId ||
                      log.payload?.user_id;

                    const isSettledRemoval = log.action === 'DELETED';
                    const isUpdated = log.action === 'UPDATED';
                    const isCreated = log.action === 'CREATED';

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setInspectLog(log)}
                        className="hover:bg-zinc-50/80 dark:hover:bg-[#141418] transition-colors cursor-pointer group"
                      >
                        {/* HTTP Status */}
                        <td className="py-3 pl-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                              log.status === 'SUCCESS'
                                ? 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'
                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                            />
                            {log.statusCode || 200}
                          </span>
                        </td>

                        {/* Action Badge */}
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                              isSettledRemoval
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50'
                                : isUpdated
                                ? 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700'
                                : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent font-semibold'
                            }`}
                          >
                            {log.action || 'PROCESSED'}
                          </span>
                        </td>

                        {/* Client / Debtor */}
                        <td className="py-3">
                          <div className="font-semibold text-zinc-900 dark:text-white text-xs truncate max-w-[180px]">
                            {log.clientName || 'Inbound Debtor'}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400 truncate max-w-[180px]">
                            {log.clientPhone || log.clientEmail || 'No contact specified'}
                          </div>
                        </td>

                        {/* User ID */}
                        <td className="py-3 font-mono text-[11px]">
                          {payloadUserId ? (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                              {payloadUserId}
                            </span>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>

                        {/* Country */}
                        <td className="py-3 text-zinc-600 dark:text-zinc-400">
                          {log.country || 'US'}
                        </td>

                        {/* Overdue */}
                        <td className="py-3 font-mono font-medium text-zinc-900 dark:text-white">
                          {log.overdueAmount != null ? `$${log.overdueAmount.toFixed(2)}` : '—'}
                        </td>

                        {/* Pre-Due */}
                        <td className="py-3 font-mono text-zinc-500 dark:text-zinc-400">
                          {log.predueAmount != null ? `$${log.predueAmount.toFixed(2)}` : '$0.00'}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3 font-mono text-[11px] text-zinc-400">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>

                        {/* Row Action Trigger */}
                        <td className="py-3 pr-4 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                            <span>Inspect</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Quickstart Integration Code */}
      {activeNavTab === 'quickstart' && (
        <div className="rounded-xl border border-zinc-200 dark:border-[#1e1e22] bg-white dark:bg-[#0c0c0e] p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Integration Quickstart
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Send an HTTP POST from your billing system or backend. Existing debtors are updated; clearing balances to $0.00 automatically purges records.
              </p>
            </div>

            {/* Code Language Selector Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-[#141416] border border-zinc-200 dark:border-[#242428]">
              {(['curl', 'node', 'python'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveCodeTab(tab)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeCodeTab === tab
                      ? 'bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {tab === 'curl' ? 'cURL' : tab === 'node' ? 'Node.js' : 'Python'}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Code Block */}
          <div className="relative rounded-xl bg-[#09090b] border border-zinc-800 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="text-[11px] font-mono text-zinc-500 ml-1">
                  {activeCodeTab === 'curl'
                    ? 'terminal'
                    : activeCodeTab === 'node'
                    ? 'inbound_sync.mjs'
                    : 'inbound_sync.py'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(snippets[activeCodeTab], setCopiedSnippet)}
                className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed max-h-96">
              {snippets[activeCodeTab]}
            </pre>
          </div>

          {/* Behavior Guidelines Callout */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#111114] border border-zinc-200 dark:border-[#1e1e22] space-y-2 text-xs">
            <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Ingestion &amp; Synchronization Rules
            </span>
            <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400 leading-relaxed pl-1">
              <li>
                <strong>Debtor Upserts:</strong> Providing a matching <code className="font-mono text-zinc-800 dark:text-zinc-200">metadata.userId</code> updates contact details, delinquency buckets, and balances without creating duplicate records.
              </li>
              <li>
                <strong>Settlement Removal:</strong> When both <code className="font-mono text-zinc-800 dark:text-zinc-200">overdueAmount: 0</code> and <code className="font-mono text-zinc-800 dark:text-zinc-200">predueAmount: 0</code> are passed, the debtor account is completely purged and active AI phone calls are cancelled.
              </li>
              <li>
                <strong>Strict Tenant Isolation:</strong> The secret key ensures data is stored exclusively in your organization workspace and never touches other tenants.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 3: Schema Reference Table */}
      {activeNavTab === 'schema' && (
        <div className="rounded-xl border border-zinc-200 dark:border-[#1e1e22] bg-white dark:bg-[#0c0c0e] overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-[#1e1e22]">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              JSON Payload Specifications
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Expected keys for HTTP POST requests to <code className="font-mono text-zinc-700 dark:text-zinc-300">/api/webhooks/incoming</code>.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-[#1e1e22] uppercase tracking-wider bg-zinc-50/80 dark:bg-[#111114]">
                <tr>
                  <th className="py-3 pl-4">Key</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">Requirement</th>
                  <th className="py-3 pr-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-[#1e1e22] text-zinc-700 dark:text-zinc-300">
                {schemaFields.map((field) => (
                  <tr key={field.name} className="hover:bg-zinc-50/50 dark:hover:bg-[#141418] transition-colors">
                    <td className="py-3 pl-4 font-mono font-bold text-zinc-900 dark:text-white">
                      {field.name}
                    </td>
                    <td className="py-3 font-mono text-zinc-500 text-[11px]">
                      {field.type}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          field.required === 'Required'
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {field.required}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {field.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-Over Inspection Drawer (Mounted via Portal for Zero Overflow Constraint) */}
      {inspectLog &&
        mounted &&
        createPortal(
          <>
            {/* Backdrop */}
            <button
              type="button"
              onClick={() => setInspectLog(null)}
              aria-label="Close drawer"
              tabIndex={-1}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 border-none p-0 w-full h-full cursor-default text-left"
            />

            {/* Side Drawer Pinned Right */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Webhook Event Inspector"
              className="fixed top-0 bottom-0 right-0 left-auto m-0 ml-auto z-[101] h-[100dvh] max-h-[100dvh] w-full sm:w-[540px] lg:w-[620px] bg-white dark:bg-[#0c0c0e] border-l border-zinc-200 dark:border-[#1e1e22] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-zinc-200 dark:border-[#1e1e22] flex items-start justify-between gap-4 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-md shrink-0">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {inspectLog.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                        inspectLog.status === 'SUCCESS'
                          ? 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'
                          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400'
                      }`}
                    >
                      HTTP {inspectLog.statusCode || 200}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold">
                      {inspectLog.action || 'PROCESSED'}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                    {inspectLog.clientName || 'Inbound Webhook Delivery'}
                  </h2>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    Received {new Date(inspectLog.timestamp).toISOString()}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectLog(null)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Meta Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-zinc-50 dark:bg-[#111114] border border-zinc-200 dark:border-[#1e1e22] text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase">Overdue</span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {inspectLog.overdueAmount != null ? `$${inspectLog.overdueAmount.toFixed(2)}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase">Pre-Due</span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {inspectLog.predueAmount != null ? `$${inspectLog.predueAmount.toFixed(2)}` : '$0.00'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase">Country</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                      {inspectLog.country || 'US'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase">Source IP</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate block">
                      {inspectLog.sourceIp || 'Direct'}
                    </span>
                  </div>
                </div>

                {/* Request Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Inbound Request Body
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(JSON.stringify(inspectLog.payload, null, 2), () => {})
                      }
                      className="text-[10px] font-mono text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy JSON</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#09090b] text-zinc-200 font-mono text-xs overflow-x-auto leading-relaxed border border-zinc-800 max-h-72">
                    {JSON.stringify(inspectLog.payload, null, 2)}
                  </pre>
                </div>

                {/* Response Body */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                    Gateway Response Body
                  </span>
                  <pre className="p-4 rounded-xl bg-[#09090b] text-zinc-200 font-mono text-xs overflow-x-auto leading-relaxed border border-zinc-800 max-h-56">
                    {JSON.stringify(inspectLog.response, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
