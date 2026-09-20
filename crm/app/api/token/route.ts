import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, RoomAgentDispatch, RoomConfiguration, TrackSource } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (
      !body || Array.isArray(body) ||
      typeof body.accountId !== 'string' ||
      !body.accountId.trim() || body.accountId.length > 100
    ) {
      return NextResponse.json({ error: 'A valid accountId is required' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY?.trim();
    const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
    const livekitUrl = process.env.LIVEKIT_URL?.trim();
    const agentName = (process.env.LIVEKIT_AGENT_NAME ?? 'recovra-collection-agent').trim();
    let validUrl = false;
    try {
      const url = new URL(livekitUrl || '');
      validUrl = ['ws:', 'wss:'].includes(url.protocol) && !!url.hostname &&
        !url.username && !url.password && !url.search && !url.hash;
    } catch {}
    if (!apiKey || !apiSecret || !livekitUrl || !agentName || !validUrl) {
      return NextResponse.json({ error: 'Voice service is not configured' }, { status: 503 });
    }

    const account = await db.getAccountById(body.accountId);
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    if (
      account.id !== body.accountId ||
      [account.name, account.originalCreditor].some(
        (value) => typeof value !== 'string' || !value.trim() || value.length > 200
      ) ||
      !Number.isFinite(account.currentBalance) || account.currentBalance < 0 ||
      !Number.isSafeInteger(account.daysPastDue) || account.daysPastDue < 0 ||
      !Number.isFinite(account.maxDiscountPercent) ||
      account.maxDiscountPercent < 0 || account.maxDiscountPercent > 100
    ) {
      return NextResponse.json({ error: 'Account is not ready for a voice session' }, { status: 422 });
    }

    const mode = body.mode === 'browser' ? 'browser' : 'phone';
    let rawPhone = typeof body.phoneNumber === 'string' && body.phoneNumber.trim() ? body.phoneNumber.trim() : account.phone?.trim();
    let formattedPhone: string | undefined;

    if (mode === 'phone') {
      if (!rawPhone) {
        return NextResponse.json({ error: 'Account does not have a valid phone number for outbound calling' }, { status: 400 });
      }
      // Sanitize phone number to E.164
      const cleaned = rawPhone.replace(/[\s\-()]/g, '');
      const phoneCandidate = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
      if (!/^\+[1-9]\d{7,14}$/.test(phoneCandidate)) {
        return NextResponse.json(
          { error: `Invalid phone format: ${rawPhone}. Outbound calls require E.164 format (e.g. +19897474190).` },
          { status: 400 }
        );
      }
      formattedPhone = phoneCandidate;
    }

    const roomName = `collection-${randomUUID()}`;
    const participantName = `operator-${randomUUID()}`;
    const borrowerIdentity = `borrower-${account.id}`;

    const settings = await db.getQueueSettings();
    const companyName = settings.companyName || settings.brandName || 'Recovra';

    const dueAmount =
      typeof body.dueAmount === 'number' && body.dueAmount >= 0
        ? body.dueAmount
        : account.overdueAmount != null && account.overdueAmount > 0
        ? account.overdueAmount
        : account.currentBalance;

    const metadataPayload: Record<string, unknown> = {
      accountId: account.id,
      debtorName: account.name,
      companyName,
      originalCreditor: account.originalCreditor,
      currentBalance: dueAmount,
      daysPastDue: account.daysPastDue,
      maxDiscountPercent: account.maxDiscountPercent,
      participantIdentity: mode === 'phone' ? borrowerIdentity : participantName,
      customPrompt: settings.customPrompt || undefined,
      greetingTemplate: settings.greetingTemplate || undefined,
    };

    if (mode === 'phone' && formattedPhone) {
      metadataPayload.phone_number = formattedPhone;
    }

    const metadata = JSON.stringify(metadataPayload);

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      name: participantName,
      ttl: '5m',
    });
    at.roomConfig = new RoomConfiguration({
      name: roomName,
      agents: [new RoomAgentDispatch({ agentName, metadata })],
    });
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishSources: [TrackSource.MICROPHONE],
      canSubscribe: true,
      canPublishData: false,
      canUpdateOwnMetadata: false,
    });

    const token = await at.toJwt();
    return NextResponse.json(
      { token, url: livekitUrl, roomName, participantName },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json({ error: 'Unable to start voice session' }, { status: 500 });
  }
}
