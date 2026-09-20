'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Room, RoomEvent, Track, createLocalAudioTrack } from 'livekit-client';
import type { LocalAudioTrack, RemoteTrack } from 'livekit-client';
import { mutate } from 'swr';
import type { Account, TranscriptMessage } from '@/lib/types';

export function formatCallTime(secs: number) {
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
}

type VoiceState = {
  callActive: boolean;
  isConnecting: boolean;
  agentConnected: boolean;
  callDuration: number;
  isMuted: boolean;
  isSpeaking: 'agent' | 'debtor' | 'idle';
  liveTranscript: TranscriptMessage[];
  error: string | null;
  audioBlocked: boolean;
};

type VoiceSession = {
  abort: AbortController;
  room: Room | null;
  microphone: LocalAudioTrack | null;
  audio: Set<RemoteTrack>;
  startedAt: number | null;
  agentTimer?: ReturnType<typeof setTimeout>;
  durationTimer?: ReturnType<typeof setInterval>;
  refreshTimer?: ReturnType<typeof setInterval>;
  muting: boolean;
};

const initialState: VoiceState = {
  callActive: false,
  isConnecting: false,
  agentConnected: false,
  callDuration: 0,
  isMuted: false,
  isSpeaking: 'idle',
  liveTranscript: [],
  error: null,
  audioBlocked: false,
};

function refreshRecords() {
  void Promise.allSettled([
    mutate('/api/accounts'),
    mutate('/api/calls'),
    mutate('/api/dashboard/stats'),
    mutate('/api/queue'),
  ]);
}

function elapsed(session: VoiceSession) {
  return session.startedAt === null ? 0 : Math.max(0, Math.floor((Date.now() - session.startedAt) / 1000));
}

export function useVoiceSession(selectedAccount: Account | null) {
  const accountId = selectedAccount?.id;
  const [state, setState] = useState<VoiceState>(initialState);
  const sessionRef = useRef<VoiceSession | null>(null);
  const scopeRef = useRef<{ accountId: string | undefined } | null>(null);

  const update = useCallback((session: VoiceSession, patch: Partial<VoiceState>) => {
    if (sessionRef.current !== session) return;
    setState((previous) => sessionRef.current === session ? { ...previous, ...patch } : previous);
  }, []);

  const stop = useCallback(async (session: VoiceSession, error: string | null = null) => {
    if (sessionRef.current === session) {
      sessionRef.current = null;
      if (scopeRef.current) {
        setState((previous) => ({
          ...previous,
          callActive: false,
          isConnecting: false,
          agentConnected: false,
          callDuration: elapsed(session),
          isMuted: false,
          isSpeaking: 'idle',
          audioBlocked: false,
          error,
        }));
      }
    }
    session.abort.abort();
    clearTimeout(session.agentTimer);
    clearInterval(session.durationTimer);
    clearInterval(session.refreshTimer);
    session.room?.removeAllListeners();
    session.microphone?.stop();
    for (const track of session.audio) {
      track.detach().forEach((element) => element.remove());
    }
    session.audio.clear();
    try {
      await session.room?.disconnect(true);
    } catch {
      if (scopeRef.current && !sessionRef.current) {
        setState((previous) => ({ ...previous, error: error ?? 'Unable to close the voice connection. Please reload before calling again.' }));
      }
    } finally {
      if (session.room) refreshRecords();
    }
  }, []);

  useEffect(() => {
    scopeRef.current = { accountId };
    setState(initialState);
    return () => {
      scopeRef.current = null;
      if (sessionRef.current) void stop(sessionRef.current);
    };
  }, [accountId, stop]);

  const handleStartCall = useCallback(async (options?: { mode?: 'phone' | 'browser'; phoneNumber?: string }) => {
    const scope = scopeRef.current;
    if (!accountId || !scope || scope.accountId !== accountId || sessionRef.current) return;
    const session: VoiceSession = {
      abort: new AbortController(),
      room: null,
      microphone: null,
      audio: new Set(),
      startedAt: null,
      muting: false,
    };
    sessionRef.current = session;
    setState({ ...initialState, isConnecting: true });
    const current = () => sessionRef.current === session && scopeRef.current === scope;
    let failure = 'Microphone access is required. Allow access and try again.';

    try {
      const microphone = await createLocalAudioTrack();
      if (!current()) {
        microphone.stop();
        return;
      }
      session.microphone = microphone;
      failure = 'Unable to start the voice session. Please try again.';
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          mode: options?.mode ?? 'phone',
          phoneNumber: options?.phoneNumber,
        }),
        signal: session.abort.signal,
      });
      if (!current()) return;
      if (!response.ok) {
        const errPayload: any = await response.json().catch(() => null);
        failure = errPayload?.error || (response.status === 401 ? 'Please sign in again before starting a call.' :
          response.status === 503 ? 'Voice service is unavailable. Please try again later.' : failure);
        throw new Error();
      }
      const payload: unknown = await response.json();
      if (!current()) return;
      if (!payload || typeof payload !== 'object' ||
        !('token' in payload) || typeof payload.token !== 'string' || !payload.token.trim() ||
        !('url' in payload) || typeof payload.url !== 'string' ||
        !('roomName' in payload) || typeof payload.roomName !== 'string' || !payload.roomName.trim() ||
        !('participantName' in payload) || typeof payload.participantName !== 'string' || !payload.participantName.trim()) {
        throw new Error();
      }
      const url = new URL(payload.url);
      if (!['ws:', 'wss:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error();
      const room = new Room();
      session.room = room;

      const waitForAgent = () => {
        if (session.agentTimer) return;
        session.agentTimer = setTimeout(() => {
          if (current()) void stop(session, 'The voice agent did not connect within 35 seconds. Please try again.');
        }, 35000);
      };
      const syncAgent = () => {
        if (!current()) return;
        const connected = [...room.remoteParticipants.values()].some((participant) => participant.isAgent);
        update(session, { agentConnected: connected });
        if (connected) {
          clearTimeout(session.agentTimer);
          session.agentTimer = undefined;
        } else {
          waitForAgent();
        }
      };
      const detachAudio = (track: RemoteTrack) => {
        track.detach().forEach((element) => element.remove());
        session.audio.delete(track);
      };
      const attachAudio = (track: RemoteTrack) => {
        if (!current() || track.kind !== Track.Kind.Audio || session.audio.has(track)) return;
        session.audio.add(track);
        const element = track.attach();
        element.hidden = true;
        document.body.appendChild(element);
      };
      const reconnecting = () => {
        if (!current()) return;
        update(session, { isConnecting: true, agentConnected: false, isSpeaking: 'idle' });
      };
      const finalized = new Set<string>();
      // Subscription is explicitly unregistered via session.room?.removeAllListeners() in stop()
      // react-doctor-disable-next-line react-doctor/effect-needs-cleanup
      room
        .on(RoomEvent.ParticipantConnected, syncAgent)
        .on(RoomEvent.ParticipantDisconnected, () => {
          syncAgent();
          update(session, { isSpeaking: 'idle' });
        })
        .on(RoomEvent.TrackSubscribed, attachAudio)
        .on(RoomEvent.TrackUnsubscribed, detachAudio)
        .on(RoomEvent.AudioPlaybackStatusChanged, (playing) => update(session, { audioBlocked: !playing }))
        .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          const speaker = speakers.find((participant) => participant.isLocal || participant.isAgent);
          update(session, { isSpeaking: speaker?.isLocal ? 'debtor' : speaker?.isAgent ? 'agent' : 'idle' });
        })
        .on(RoomEvent.TranscriptionReceived, (segments, participant) => {
          if (!current() || !participant || (!participant.isLocal && !participant.isAgent)) return;
          const speaker = participant.isLocal ? 'debtor' : 'agent';
          const messages: TranscriptMessage[] = [];
          for (const segment of segments) {
            const id = `${participant.identity}:${segment.id}`;
            if (finalized.has(id)) continue;
            if (segment.final) finalized.add(id);
            messages.push({ id, speaker, text: segment.text, timestamp: formatCallTime(elapsed(session)) });
          }
          setState((previous) => {
            if (!current()) return previous;
            const liveTranscript = [...previous.liveTranscript];
            for (const message of messages) {
              const index = liveTranscript.findIndex((entry) => entry.id === message.id);
              if (index === -1) liveTranscript.push(message);
              else liveTranscript[index] = { ...message, timestamp: liveTranscript[index].timestamp };
            }
            return { ...previous, liveTranscript };
          });
        })
        .on(RoomEvent.Reconnecting, reconnecting)
        .on(RoomEvent.SignalReconnecting, reconnecting)
        .on(RoomEvent.Reconnected, () => {
          update(session, { isConnecting: false });
          syncAgent();
        })
        .on(RoomEvent.Disconnected, () => {
          if (current()) void stop(session, 'The voice connection ended. You can start a new call.');
        })
        .on(RoomEvent.MediaDevicesError, () => {
          if (current()) void stop(session, 'Microphone access was interrupted. Check your device and try again.');
        })
        .on(RoomEvent.TrackSubscriptionFailed, () => {
          if (current()) void stop(session, 'Unable to receive call audio. Please try again.');
        });

      failure = 'Unable to connect the call. Please check your connection and try again.';
      await room.connect(payload.url, payload.token);
      if (!current()) {
        await room.disconnect(true);
        return;
      }
      session.startedAt = Date.now();
      update(session, { callActive: true });
      session.durationTimer = setInterval(() => update(session, { callDuration: elapsed(session) }), 1000);
      session.refreshTimer = setInterval(refreshRecords, 5000);
      syncAgent();
      for (const participant of room.remoteParticipants.values()) {
        for (const publication of participant.audioTrackPublications.values()) {
          if (publication.track) attachAudio(publication.track);
        }
      }
      failure = 'Unable to publish microphone audio. Check your device and try again.';
      await room.localParticipant.publishTrack(microphone);
      if (!current()) {
        microphone.stop();
        await room.disconnect(true);
        return;
      }
      update(session, { isConnecting: false, isMuted: microphone.isMuted });
      try {
        await room.startAudio();
        update(session, { audioBlocked: !room.canPlaybackAudio });
      } catch {
        update(session, { audioBlocked: true });
      }
    } catch {
      if (current()) await stop(session, failure);
    }
  }, [accountId, stop, update]);

  const handleEndCall = useCallback(async () => {
    if (sessionRef.current) await stop(sessionRef.current);
  }, [stop]);

  const toggleMute = useCallback(async () => {
    const session = sessionRef.current;
    if (!session?.microphone || session.startedAt === null || session.muting) return;
    session.muting = true;
    try {
      if (session.microphone.isMuted) await session.microphone.unmute();
      else await session.microphone.mute();
      if (sessionRef.current !== session) session.microphone.stop();
      else update(session, { isMuted: session.microphone.isMuted });
    } catch {
      update(session, { error: 'Unable to change microphone settings. Please try again.' });
    } finally {
      session.muting = false;
    }
  }, [update]);

  const enableAudio = useCallback(async () => {
    const session = sessionRef.current;
    if (!session?.room) return;
    try {
      await session.room.startAudio();
      update(session, { audioBlocked: !session.room.canPlaybackAudio });
    } catch {
      update(session, { audioBlocked: true });
    }
  }, [update]);

  return { ...state, handleStartCall, handleEndCall, toggleMute, enableAudio };
}
