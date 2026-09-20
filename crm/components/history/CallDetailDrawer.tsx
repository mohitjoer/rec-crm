'use client';

import React from 'react';
import { X, MessageSquareText, AlertTriangle } from 'lucide-react';
import { CallRecord } from '@/lib/types';
import { STATUS_META, SENTIMENT_META, formatDate, formatTime, formatDuration } from '@/app/logs/page';

interface CallDetailDrawerProps {
  call: CallRecord;
  onClose: () => void;
}

export function CallDetailDrawer({ call, onClose }: CallDetailDrawerProps) {
  const statusMeta = STATUS_META[call.status] || STATUS_META.IN_PROGRESS;
  const sentimentMeta = SENTIMENT_META[call.sentiment] || SENTIMENT_META.NEUTRAL;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close panel"
        tabIndex={-1}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 border-none p-0 w-full h-full cursor-default text-left"
      />

      {/* Side Drawer Container pinned strictly to viewport right side */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Call Details - ${call.debtorName}`}
        className="fixed top-0 bottom-0 right-0 left-auto m-0 ml-auto z-[101] h-screen h-[100dvh] max-h-[100dvh] w-full sm:w-[520px] lg:w-[600px] bg-white dark:bg-[#0c0c0e] border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-md shrink-0">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                {call.id}
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${statusMeta.className}`}
              >
                {statusMeta.icon}
                {statusMeta.label}
              </span>
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white truncate">
              {call.debtorName}
            </h2>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <span>
                Acct ID: <strong className="text-zinc-700 dark:text-zinc-300">{call.accountId}</strong>
              </span>
              <span>•</span>
              <span>
                {formatDate(call.startTime)} at {formatTime(call.startTime)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close panel"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Clean Inline Metadata Bar */}
          <div className="py-3 border-y border-zinc-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 dark:text-zinc-500">Duration:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatDuration(call.durationSeconds)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 dark:text-zinc-500">Compliance:</span>
              <span
                className={`font-semibold ${call.complianceScore >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}
              >
                {call.complianceScore}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 dark:text-zinc-500">Sentiment:</span>
              <span className={`font-semibold capitalize ${sentimentMeta.color}`}>
                {call.sentiment.toLowerCase()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 dark:text-zinc-500">Mini-Miranda:</span>
              <span
                className={`font-semibold ${call.miniMirandaPassed ? 'text-emerald-500' : 'text-red-500'}`}
              >
                {call.miniMirandaPassed ? 'Passed' : 'Failed'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 dark:text-zinc-500">Outcome:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {call.disposition.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Promise to Pay (if present) */}
          {call.amountPromised !== undefined && call.amountPromised > 0 && (
            <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="font-medium">Promise to Pay:</span>
              <span className="font-bold">
                ${call.amountPromised.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                {call.promisedDate ? ` on ${call.promisedDate}` : ''}
              </span>
            </div>
          )}

          {/* AI Executive Summary */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              AI Summary
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">{call.summary}</p>
          </div>

          {/* Voice Transcript Container Box */}
          <div className="rounded-2xl bg-zinc-50 dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800/90 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-zinc-100/70 dark:bg-[#16161a] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquareText className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Voice Transcript
                </span>
              </div>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {call.transcript?.length || 0} messages
              </span>
            </div>

            <div className="p-4 space-y-3.5 max-h-[460px] overflow-y-auto">
              {call.transcript && call.transcript.length > 0 ? (
                call.transcript.map((t) => {
                  const isAgent = t.speaker === 'agent';
                  const isSystem = t.speaker === 'system';

                  if (isSystem) {
                    return (
                      <div key={t.id} className="text-center py-1 text-[11px] text-zinc-400 italic">
                        {t.text}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={t.id}
                      className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} space-y-1`}
                    >
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {isAgent ? 'Recovra Specialist' : call.debtorName}
                        </span>
                        <span className="font-mono">{t.timestamp}</span>
                        {t.sentiment && (
                          <span
                            className={`uppercase font-bold text-[9px] ${(SENTIMENT_META[t.sentiment.toUpperCase()] || SENTIMENT_META.NEUTRAL).color}`}
                          >
                            {t.sentiment}
                          </span>
                        )}
                      </div>
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed max-w-[88%] ${
                          isAgent
                            ? 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm'
                            : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-tr-sm'
                        }`}
                      >
                        {t.text}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center space-y-1">
                  <AlertTriangle className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                  <p className="text-xs text-zinc-400">No audio transcript captured for this call.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
