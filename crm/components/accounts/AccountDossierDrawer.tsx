'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  Send,
  Loader2,
  FileText,
  Clock,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Radio,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { Account } from '@/lib/types';
import { mutate } from 'swr';
import { ACCOUNT_STATUS_META } from '@/app/accounts/page';
import { formatCallTime, useVoiceSession } from '@/lib/useVoiceSession';

interface AccountDossierDrawerProps {
  account: Account;
  onClose: () => void;
  onAccountUpdated: (updated: Account) => void;
}

type PhoneCallState = 'IDLE' | 'DIALING' | 'RINGING' | 'CONNECTED' | 'ENDED';

// react-doctor-disable-next-line react-doctor/no-giant-component, react-doctor/no-high-complexity-react-function
export function AccountDossierDrawer({
  account,
  onClose,
  onAccountUpdated,
}: AccountDossierDrawerProps) {
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Call state management
  const [phoneState, setPhoneState] = useState<PhoneCallState>('IDLE');
  const [phoneDuration, setPhoneDuration] = useState(0);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [isHangingUp, setIsHangingUp] = useState(false);

  const activeRoomRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state on account change
  const prevAccountIdRef = useRef(account.id);
  if (prevAccountIdRef.current !== account.id) {
    prevAccountIdRef.current = account.id;
    setPhoneError(null);
    setSuccessMessage(null);
    setPhoneState('IDLE');
    setPhoneDuration(0);
  }

  // WebRTC in-browser voice session
  const session = useVoiceSession(account);

  // Exact due balance to collect (prioritizing overdueAmount if specified, otherwise current balance)
  const dueAmount =
    account.overdueAmount != null && account.overdueAmount > 0
      ? account.overdueAmount
      : account.currentBalance;

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, []);

  const stopPhoneCall = (clearWithDelay = false) => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    activeRoomRef.current = null;
    setIsHangingUp(false);
    setIsStartingCall(false);
    if (clearWithDelay) {
      setPhoneState('ENDED');
      setTimeout(() => {
        setPhoneState('IDLE');
        setPhoneDuration(0);
      }, 4000);
    } else {
      setPhoneState('IDLE');
      setPhoneDuration(0);
    }
  };

  const handleTriggerCall = async () => {
    const targetPhone = account.phone?.trim();
    if (!targetPhone) {
      setPhoneError('No valid telephone number available for this debtor account.');
      return;
    }
    setPhoneError(null);
    setSuccessMessage(null);
    setIsStartingCall(true);
    setPhoneState('DIALING');
    setPhoneDuration(0);

    try {
      const res = await fetch('/api/calls/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          phoneNumber: targetPhone,
          dueAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPhoneError(data.error || 'Failed to dispatch outbound collection call.');
        stopPhoneCall();
        return;
      }

      if (data.updatedAccount) {
        onAccountUpdated(data.updatedAccount);
      }

      const roomName = data.roomName;
      activeRoomRef.current = roomName;
      setIsStartingCall(false);
      setSuccessMessage(
        `AI collection call dispatched to ${data.phoneNumber} for $${dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} due.`
      );

      // Poll call status
      pollTimerRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(
            `/api/calls/dispatch/status?roomName=${encodeURIComponent(roomName)}`
          );
          if (!statusRes.ok) return;
          const statusData = await statusRes.json();
          if (statusData.status) {
            setPhoneState(statusData.status);
            if (statusData.status === 'CONNECTED') {
              if (!durationTimerRef.current) {
                durationTimerRef.current = setInterval(() => {
                  setPhoneDuration((d) => d + 1);
                }, 1000);
              }
            } else if (statusData.status === 'ENDED') {
              mutate('/api/calls');
              mutate('/api/queue');
              stopPhoneCall(true);
            }
          }
        } catch {
          // Poll retry
        }
      }, 2000);
    } catch (err: any) {
      setPhoneError(err?.message || 'Network error occurred while initiating call.');
      stopPhoneCall();
    }
  };

  const handleHangupPhone = async () => {
    if (!activeRoomRef.current) {
      stopPhoneCall();
      return;
    }
    setIsHangingUp(true);
    try {
      await fetch('/api/calls/dispatch/hangup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: activeRoomRef.current, accountId: account.id }),
      });
      mutate('/api/calls');
      mutate('/api/queue');
    } catch {
      // ignore
    }
    stopPhoneCall(true);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setIsSavingNote(true);
    const newNote = {
      id: `n-${Date.now()}`,
      text: noteText.trim(),
      date: new Date().toISOString().split('T')[0],
      author: 'Recovery Officer',
    };
    const updatedNotes = [newNote, ...(account.notes || [])];

    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: updatedNotes }),
      });
      if (res.ok) {
        const updated = await res.json();
        onAccountUpdated(updated);
        setNoteText('');
      }
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const statusMeta = ACCOUNT_STATUS_META[account.status] || ACCOUNT_STATUS_META.ACTIVE;
  const isPhoneBusy = phoneState !== 'IDLE' && phoneState !== 'ENDED';
  const isWebBusy = session.callActive || session.isConnecting;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end m-0 p-0">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close drawer"
        tabIndex={-1}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity border-none p-0 w-full h-full cursor-default text-left"
      />

      {/* Drawer Container strictly pinned to right edge */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Account Details - ${account.name}`}
        className="fixed inset-y-0 right-0 left-auto m-0 ml-auto z-[101] w-full max-w-xl md:max-w-2xl bg-white dark:bg-[#09090b] border-l border-zinc-200 dark:border-[#1e1e22] shadow-2xl flex flex-col h-full max-h-screen overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-[#1e1e22] flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-[#0c0c0e]">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
                {account.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white truncate">
              {account.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Inline Metadata Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-3 px-4 rounded-xl bg-zinc-50 dark:bg-[#121215] border border-zinc-200 dark:border-[#1e1e24] text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Phone</span>
              <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                {account.phone}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Email</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate block">
                {account.email || 'None'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Country</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate block">
                {account.country || 'United States'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Balance</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                ${account.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Aging</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {account.daysPastDue}d ({account.bucket.replace(/_/g, ' ')})
              </span>
            </div>
          </div>

          {/* Call Outreach Control Card (Prominent Call Action on Due Amount) */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#121215] border border-zinc-200 dark:border-[#1e1e24] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  Autonomous Call Outreach
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                Due: ${dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Active Phone Call State Banner */}
            {isPhoneBusy ? (
              <div className="p-3.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2">
                      <span>
                        {phoneState === 'DIALING'
                          ? `Dialing ${account.phone}...`
                          : phoneState === 'RINGING'
                          ? 'Debtor Phone Ringing...'
                          : 'On Call · AI Resolution Active'}
                      </span>
                      <span className="font-mono text-[11px] opacity-80 px-1.5 py-0.2 rounded bg-black/20 dark:bg-zinc-200">
                        {formatCallTime(phoneDuration)}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-600">
                      Demanding balance of ${dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleHangupPhone}
                  disabled={isHangingUp}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>{isHangingUp ? 'Disconnecting...' : 'Hang Up Call'}</span>
                </button>
              </div>
            ) : isWebBusy ? (
              <div className="p-3.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <Volume2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 animate-pulse" />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2">
                      <span>
                        {session.callActive
                          ? 'Browser Test Call Active'
                          : 'Connecting to Voice Agent...'}
                      </span>
                      <span className="font-mono text-[11px] opacity-80 px-1.5 py-0.2 rounded bg-black/20 dark:bg-zinc-200">
                        {formatCallTime(session.callDuration)}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-600">
                      Testing prompt with ${dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} due
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={session.isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    onClick={() => void session.toggleMute()}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-200 dark:hover:bg-zinc-300 text-xs transition-colors cursor-pointer"
                  >
                    {session.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => void session.handleEndCall()}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>End Web Call</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Trigger an autonomous conversational phone call to collect the outstanding due balance of{' '}
                  <strong className="text-zinc-900 dark:text-white font-mono">
                    ${dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                  . The AI recovery specialist will confirm the debtor, inform them of this exact balance, and secure a commitment.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => void handleTriggerCall()}
                    disabled={isStartingCall || !account.phone}
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isStartingCall ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <PhoneCall className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                    )}
                    <span>
                      Trigger Call on Due Amount ($
                      {dueAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      )
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void session.handleStartCall({ mode: 'browser' })}
                    title="Test call in browser via microphone"
                    className="px-3 py-2.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Mic className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Browser Test</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error banner */}
            {phoneError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center justify-between"
              >
                <span>{phoneError}</span>
                <button
                  type="button"
                  onClick={() => setPhoneError(null)}
                  className="underline text-[11px] ml-2 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Success banner */}
            {successMessage && !phoneError && (
              <div
                role="status"
                className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between"
              >
                <span>{successMessage}</span>
                <button
                  type="button"
                  onClick={() => setSuccessMessage(null)}
                  className="underline text-[11px] ml-2 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Financial & Settlement Terms */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Balance &amp; Settlement Architecture
            </h3>
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#121215] border border-zinc-200 dark:border-[#1e1e24] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Original Creditor:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {account.originalCreditor}
                </span>
              </div>
              {account.overdueAmount != null && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Overdue Balance:</span>
                  <span className="font-semibold font-mono text-zinc-900 dark:text-white">
                    ${account.overdueAmount.toFixed(2)}
                  </span>
                </div>
              )}
              {account.predueAmount != null && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Pre-due (Upcoming) Balance:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    ${account.predueAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Original Balance:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  ${account.originalBalance.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Max Approved Discount:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {account.maxDiscountPercent}% ($
                  {Math.round(
                    account.currentBalance * (1 - account.maxDiscountPercent / 100)
                  ).toLocaleString()}{' '}
                  payoff)
                </span>
              </div>
              {account.promiseToPay && (
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-600 dark:text-zinc-400">Active Promise to Pay:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ${account.promiseToPay.amount.toFixed(2)} on {account.promiseToPay.date} (
                    {account.promiseToPay.status})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Account Activity & Notes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Account Notes &amp; Audit Trail
              </h3>
              <span className="text-[10px] text-zinc-500">
                {(account.notes || []).length} recorded
              </span>
            </div>

            {/* Add Note Input */}
            <div className="flex gap-2">
              <input
                type="text"
                aria-label="Add account note"
                placeholder="Add operational or workout note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddNote();
                }}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-[#121215] border border-zinc-200 dark:border-[#1e1e24] text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700"
              />
              <button
                disabled={isSavingNote || !noteText.trim()}
                onClick={handleAddNote}
                className="px-3 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                {isSavingNote ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Save</span>
              </button>
            </div>

            {/* Notes List */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {(account.notes || []).length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">
                  No notes logged for this debtor account yet.
                </p>
              ) : (
                account.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-[#121215] border border-zinc-200 dark:border-[#1e1e24] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {note.author}
                      </span>
                      <span>{note.date}</span>
                    </div>
                    <p className="text-zinc-800 dark:text-zinc-200">{note.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-[#1e1e22] flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-[#09090b]">
          <div className="flex items-center gap-1.5">
            <Link
              href="/logs"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Call Logs</span>
            </Link>
            <Link
              href="/queue"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Recovery Queue</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Close
            </button>

            {isPhoneBusy ? (
              <button
                type="button"
                onClick={handleHangupPhone}
                disabled={isHangingUp}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>
                  {isHangingUp ? 'Disconnecting...' : `Hang Up (${formatCallTime(phoneDuration)})`}
                </span>
              </button>
            ) : isWebBusy ? (
              <button
                type="button"
                onClick={() => void session.handleEndCall()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>End Web Session</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleTriggerCall()}
                disabled={isStartingCall || !account.phone}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isStartingCall ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                )}
                <span>
                  Trigger Call ($
                  {dueAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  Due)
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
