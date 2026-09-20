'use client';

import React, { useState, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import {
  RotateCcw,
  Check,
  Loader2,
  Copy,
  Eye,
  Code2,
  Volume2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { QueueSettings } from '@/lib/types';
import { fetcher } from '@/lib/fetcher';
import {
  DEFAULT_AGENT_PROMPT,
  DEFAULT_GREETING_TEMPLATE,
  PROMPT_VARIABLES,
} from '@/lib/promptDefaults';

export default function AgentPromptPage() {
  const { data: settings, isLoading } = useSWR<QueueSettings>('/api/settings', fetcher, {
    revalidateOnFocus: false,
  });

  const [promptText, setPromptText] = useState<string>(DEFAULT_AGENT_PROMPT);
  const [greetingText, setGreetingText] = useState<string>(DEFAULT_GREETING_TEMPLATE);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const initialLoadedRef = useRef(false);

  useEffect(() => {
    if (settings && !initialLoadedRef.current) {
      if (settings.customPrompt && settings.customPrompt.trim().length > 0) {
        setPromptText(settings.customPrompt);
      } else {
        setPromptText(DEFAULT_AGENT_PROMPT);
      }

      if (settings.greetingTemplate && settings.greetingTemplate.trim().length > 0) {
        setGreetingText(settings.greetingTemplate);
      } else {
        setGreetingText(DEFAULT_GREETING_TEMPLATE);
      }
      initialLoadedRef.current = true;
    }
  }, [settings]);

  const companyName = settings?.companyName || settings?.brandName || 'Recovra';

  // Insert variable tag into cursor position
  const handleInsertVariable = (varKey: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      navigator.clipboard.writeText(varKey);
      setCopiedKey(varKey);
      setTimeout(() => setCopiedKey(null), 2000);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = promptText.substring(0, start);
    const after = promptText.substring(end);
    const updated = before + varKey + after;

    setPromptText(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + varKey.length, start + varKey.length);
    }, 0);

    setCopiedKey(varKey);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isSavingRef = useRef(false);

  const handleSave = async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setSaveStatus('saving');
    setSaveMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customPrompt: promptText,
          greetingTemplate: greetingText,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save prompt');
      }

      const updated = await res.json();
      mutate('/api/settings', updated, false);
      setSaveStatus('saved');
      setSaveMessage('Prompt settings updated successfully');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      setSaveMessage(err.message || 'Save failed');
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleResetToDefault = async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setShowResetConfirm(false);
    setPromptText(DEFAULT_AGENT_PROMPT);
    setGreetingText(DEFAULT_GREETING_TEMPLATE);
    setSaveStatus('saving');
    setSaveMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customPrompt: '',
          greetingTemplate: DEFAULT_GREETING_TEMPLATE,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to reset prompt');
      }

      const updated = await res.json();
      mutate('/api/settings', updated, false);
      setSaveStatus('saved');
      setSaveMessage('Restored standard FDCPA compliant prompt');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      setSaveMessage(err.message || 'Failed to reset prompt');
    } finally {
      isSavingRef.current = false;
    }
  };

  // Compile preview with mock account
  const renderMockPreview = (raw: string) => {
    const now = new Date();
    const mock = {
      '{current_date}': now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      '{current_time}': now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      '{company_name}': companyName,
      '{debtor_name}': 'Michael Vance',
      '{account_id}': 'ACC-8821',
      '{original_creditor}': 'Horizon Premier Visa',
      '{outstanding_balance}': '4,250.00',
      '{days_past_due}': '68',
      '{max_discount_percent}': '20',
    };

    let result = raw;
    for (const [k, v] of Object.entries(mock)) {
      result = result.split(k).join(v);
    }
    return result;
  };

  const isCustomized =
    promptText.trim() !== DEFAULT_AGENT_PROMPT.trim() ||
    greetingText.trim() !== DEFAULT_GREETING_TEMPLATE.trim();

  return (
    <div className="space-y-6 max-w-5xl pb-20">
      {/* Breadcrumb Navigation & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Agent Prompt &amp; Instructions
            </h1>
            {isCustomized ? (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-950">
                Customized
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                Standard FDCPA
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Define Sarah&rsquo;s conversational persona, negotiation boundaries, and objection-handling rules for live calls.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={saveStatus === 'saving' || !isCustomized}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              !isCustomized
                ? 'opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800'
                : 'bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 transition-colors shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Notification Banner */}
      {saveStatus === 'saved' && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveMessage || 'Changes saved successfully.'}</span>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{saveMessage || 'An error occurred while saving.'}</span>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Reset Prompt to System Default?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  This will overwrite all custom instructions with the standard FDCPA compliant prompt template.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 transition-opacity cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: Outbound Spoken Greeting */}
      <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-zinc-500" />
            <label htmlFor="greeting-template-input" className="text-xs font-bold text-zinc-900 dark:text-white">
              Spoken Opening Greeting
            </label>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
            First words upon answer
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          The opening sentence spoken by Sarah as soon as the borrower picks up the call.
        </p>
        <input
          id="greeting-template-input"
          type="text"
          value={greetingText}
          onChange={(e) => setGreetingText(e.target.value)}
          placeholder="Hello, this is Sarah calling from {company_name}. Am I speaking with {debtor_name}?"
          className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-colors"
        />
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 pt-0.5">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Live Preview:</span>
          <span className="font-mono text-zinc-800 dark:text-zinc-200">
            &ldquo;{renderMockPreview(greetingText)}&rdquo;
          </span>
        </div>
      </div>

      {/* Dynamic Template Variables Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
            <span>Available Dynamic Variables</span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Click chip to insert at cursor
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PROMPT_VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => handleInsertVariable(v.key)}
              title={`${v.desc} (e.g. "${v.example}")`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer group"
            >
              <span className="font-semibold text-zinc-950 dark:text-white">{v.key}</span>
              <span className="text-[10px] font-sans text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                {v.label}
              </span>
              {copiedKey === v.key ? (
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
              ) : (
                <Copy className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Primary System Prompt Editor / Preview Container */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 px-4 py-2.5">
          {/* View Modes */}
          <div className="inline-flex p-0.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Prompt Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Rendered Preview</span>
            </button>
          </div>

          {/* Prompt Metrics */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
            <span>{promptText.length.toLocaleString()} chars</span>
            <span>&bull;</span>
            <span>~{Math.round(promptText.length / 4).toLocaleString()} tokens</span>
          </div>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        ) : activeTab === 'editor' ? (
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={22}
              spellCheck={false}
              aria-label="Agent System Prompt"
              className="w-full p-4 font-mono text-xs leading-relaxed bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none resize-y selection:bg-zinc-200 dark:selection:bg-zinc-800"
              placeholder="Enter system prompt instructions..."
            />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <span>Previewing with Mock Account:</span>
              <span className="text-zinc-900 dark:text-white font-mono">
                Michael Vance &bull; ACC-8821 &bull; Horizon Premier Visa &bull; $4,250.00
              </span>
            </div>
            <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-zinc-800 dark:text-zinc-200 selection:bg-zinc-200 dark:selection:bg-zinc-800">
              {renderMockPreview(promptText)}
            </pre>
          </div>
        )}
      </div>

    </div>
  );
}
