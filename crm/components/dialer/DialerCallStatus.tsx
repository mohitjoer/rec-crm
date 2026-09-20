'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PhoneCall, PhoneOff, Mic, MicOff, Volume2, Loader2, Sparkles, Radio } from 'lucide-react';
import { Account } from '@/lib/types';
import { formatCallTime, useVoiceSession } from '@/lib/useVoiceSession';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DialerCallStatusProps {
  selectedAccount: Account | null;
  session: ReturnType<typeof useVoiceSession>;
}

type PhoneCallState = 'IDLE' | 'DIALING' | 'RINGING' | 'CONNECTED' | 'ENDED';

export function DialerCallStatus({ selectedAccount, session }: DialerCallStatusProps) {
  const [phoneNumber, setPhoneNumber] = useState(selectedAccount?.phone || '');
  const [phoneState, setPhoneState] = useState<PhoneCallState>('IDLE');
  const activeRoomRef = useRef<string | null>(null);
  const [phoneDuration, setPhoneDuration] = useState(0);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isHangingUp, setIsHangingUp] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync selected account phone
  useEffect(() => {
    if (selectedAccount?.phone) {
      setPhoneNumber(selectedAccount.phone);
    }
  }, [selectedAccount?.id, selectedAccount?.phone]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, []);

  const stopPhoneCall = (clearMessageDelay = false) => {
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
    if (clearMessageDelay) {
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

  const handleDialPhone = async () => {
    if (!selectedAccount || !phoneNumber.trim()) return;
    setPhoneError(null);
    setPhoneState('DIALING');
    setPhoneDuration(0);

    try {
      const res = await fetch('/api/calls/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccount.id,
          phoneNumber: phoneNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPhoneError(data.error || 'Failed to place call to this number.');
        stopPhoneCall();
        return;
      }

      const roomName = data.roomName;
      activeRoomRef.current = roomName;

      // Start polling status
      pollTimerRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/calls/dispatch/status?roomName=${encodeURIComponent(roomName)}`);
          if (!statusRes.ok) return;
          const statusData = await statusRes.json();
          if (statusData.state) {
            setPhoneState(statusData.state);
            if (statusData.state === 'CONNECTED') {
              if (!durationTimerRef.current) {
                durationTimerRef.current = setInterval(() => {
                  setPhoneDuration((d) => d + 1);
                }, 1000);
              }
            } else if (statusData.state === 'ENDED') {
              stopPhoneCall(true);
            }
          }
        } catch {
          // Poll failed, keep trying until limit or hangup
        }
      }, 2000);
    } catch (err: any) {
      setPhoneError(err?.message || 'Network error occurred while placing call.');
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
        body: JSON.stringify({ roomName: activeRoomRef.current }),
      });
    } catch {}
    stopPhoneCall(true);
  };

  const isPhoneBusy = phoneState !== 'IDLE' && phoneState !== 'ENDED';
  const isWebBusy = session.callActive || session.isConnecting;

  return (
    <Card className="min-w-0 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Outbound Telephony Dialer</h2>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/60 font-mono text-zinc-600 dark:text-zinc-400">
              <Radio className="w-2.5 h-2.5 text-zinc-600 dark:text-zinc-400" />
              Twilio SIP Trunk
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 break-words">
            {selectedAccount
              ? `${selectedAccount.name} · ${selectedAccount.originalCreditor} · Outstanding: $${selectedAccount.currentBalance.toLocaleString()}`
              : 'Select an account from the ledger below.'}
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isPhoneBusy && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-zinc-500" />}
          <span role="status" className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
            {phoneState === 'DIALING'
              ? `Dialing ${phoneNumber}…`
              : phoneState === 'RINGING'
              ? 'Phone ringing…'
              : phoneState === 'CONNECTED'
              ? 'On Phone Call · AI Active'
              : phoneState === 'ENDED'
              ? 'Phone Call Ended'
              : isWebBusy
              ? session.callActive ? 'Browser Web Call Active' : 'Connecting web…'
              : 'Ready for outbound call'}
          </span>
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Places a direct phone call to your mobile number via your configured Twilio SIP Trunk. The AI agent speaks directly over your cellular line. Zero browser microphone or audio permissions required.
      </p>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {isPhoneBusy ? (
          <>
            <span className="font-mono text-sm tabular-nums px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-semibold">
              {formatCallTime(phoneDuration)}
            </span>
            <Button
              type="button"
              variant="destructive"
              className="min-h-10 gap-1.5 font-medium"
              disabled={isHangingUp}
              onClick={() => void handleHangupPhone()}
            >
              <PhoneOff className="w-4 h-4" /> {isHangingUp ? 'Disconnecting…' : 'Hang Up Call'}
            </Button>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {phoneState === 'CONNECTED' ? 'Talk through your phone' : 'Waiting for you to pick up…'}
            </span>
          </>
        ) : isWebBusy ? (
          <>
            <span className="font-mono text-sm tabular-nums px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              {formatCallTime(session.callDuration)}
            </span>
            <Button
              type="button"
              variant="outline"
              className="min-h-10 gap-1.5"
              disabled={!session.callActive || session.isConnecting}
              aria-pressed={session.isMuted}
              onClick={() => void session.toggleMute()}
            >
              {session.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              {session.isMuted ? 'Unmute' : 'Mute'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-10 gap-1.5"
              onClick={() => void session.handleEndCall()}
            >
              <PhoneOff className="w-3.5 h-3.5" /> End Web Session
            </Button>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+19897474190"
                aria-label="Destination phone number"
                className="h-10 px-3 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 w-52 shadow-sm"
                disabled={!selectedAccount}
              />
              <Button
                type="button"
                className="min-h-10 gap-2 font-semibold shadow-sm"
                disabled={!selectedAccount || !phoneNumber.trim()}
                onClick={() => void handleDialPhone()}
              >
                <PhoneCall className="w-4 h-4" /> Call My Phone
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              className="min-h-10 gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              disabled={!selectedAccount}
              onClick={() => void session.handleStartCall({ mode: 'browser' })}
            >
              <Mic className="w-3.5 h-3.5" /> Browser Test Mode
            </Button>
          </div>
        )}
      </div>

      {/* Error alert */}
      {phoneError && (
        <div role="alert" className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>{phoneError}</span>
          <button type="button" onClick={() => setPhoneError(null)} className="underline ml-2">Dismiss</button>
        </div>
      )}
      {session.error && !phoneError && (
        <div role="alert" className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
          {session.error}
        </div>
      )}
    </Card>
  );
}
