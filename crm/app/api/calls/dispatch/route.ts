import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getLiveKitClients } from '@/lib/livekit-server';
import { CallRecord, QueuedCall } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.accountId !== 'string' || !body.accountId.trim()) {
      return NextResponse.json({ error: 'Valid accountId is required' }, { status: 400 });
    }

    const userId = (session.user as any).id?.toString();
    const account = await db.getAccountById(body.accountId, userId);
    if (!account) {
      return NextResponse.json({ error: 'Account not found or access denied' }, { status: 404 });
    }

    const rawPhone = typeof body.phoneNumber === 'string' && body.phoneNumber.trim()
      ? body.phoneNumber.trim()
      : account.phone?.trim();

    if (!rawPhone) {
      return NextResponse.json({ error: 'No phone number provided for outbound call' }, { status: 400 });
    }

    // Format phone to E.164
    const cleaned = rawPhone.replace(/[\s\-()]/g, '');
    const formattedPhone = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
    if (!/^\+[1-9]\d{7,14}$/.test(formattedPhone)) {
      return NextResponse.json(
        { error: `Invalid phone format: ${rawPhone}. Outbound calls require E.164 format (e.g. +19897474190).` },
        { status: 400 }
      );
    }

    const dueAmount =
      typeof body.dueAmount === 'number' && body.dueAmount >= 0
        ? body.dueAmount
        : account.overdueAmount != null && account.overdueAmount > 0
        ? account.overdueAmount
        : account.currentBalance;

    const { agentDispatchClient } = getLiveKitClients();
    const agentName = (process.env.LIVEKIT_AGENT_NAME ?? 'recovra-collection-agent').trim();
    const roomName = `call-${randomUUID().slice(0, 12)}`;
    const participantIdentity = `borrower-${account.id}`;

    const settings = await db.getQueueSettings(userId);
    const companyName = settings.companyName || settings.brandName || 'Recovra';

    const metadata = JSON.stringify({
      accountId: account.id,
      debtorName: account.name,
      companyName,
      originalCreditor: account.originalCreditor,
      currentBalance: dueAmount,
      daysPastDue: account.daysPastDue,
      maxDiscountPercent: account.maxDiscountPercent,
      phone_number: formattedPhone,
      participantIdentity,
      customPrompt: settings.customPrompt || undefined,
      greetingTemplate: settings.greetingTemplate || undefined,
    });

    const dispatch = await agentDispatchClient.createDispatch(roomName, agentName, { metadata });

    // Append operational note to debtor dossier audit trail
    const callNote = {
      id: `n-${Date.now()}`,
      text: `Autonomous collection call dispatched to ${formattedPhone} on due balance of $${dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
      date: new Date().toISOString().split('T')[0],
      author: 'AI Voice Engine',
    };
    const updatedAccount = await db.updateAccount(
      account.id,
      {
        notes: [callNote, ...(account.notes || [])],
        lastContactDate: new Date().toISOString().split('T')[0],
      },
      userId
    );

    // Record active call in calls collection so it immediately appears in /logs
    const newCall: CallRecord = {
      id: `CALL-${Math.floor(1000 + Math.random() * 9000)}`,
      userId,
      accountId: account.id,
      debtorName: account.name,
      startTime: new Date().toISOString(),
      durationSeconds: 0,
      status: 'IN_PROGRESS',
      disposition: 'CALL_BACK',
      sentiment: 'NEUTRAL',
      complianceScore: 100,
      miniMirandaPassed: true,
      transcript: [],
      summary: `Autonomous collection call dispatched on due balance of $${dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
    };
    await db.addCall(newCall, userId);

    // Record in queued_calls so it immediately appears in /queue under Dialing
    const existingQueueList = await db.getQueuedCalls(userId);
    const existingQueue = existingQueueList.find((q) => q.accountId === account.id);
    const attemptCount = (existingQueue?.attemptCount || 0) + 1;

    const queueRecord: QueuedCall = {
      id: existingQueue?.id || `Q-${Math.floor(1000 + Math.random() * 9000)}`,
      userId,
      accountId: account.id,
      debtorName: account.name,
      phoneNumber: formattedPhone,
      originalCreditor: account.originalCreditor,
      currentBalance: dueAmount,
      lastAttemptAt: new Date().toISOString(),
      lastDisposition: 'CALL_BACK',
      attemptCount,
      maxAttempts: settings.maxReattempts || 3,
      nextAttemptAt: new Date().toISOString(),
      status: 'IN_PROGRESS',
      createdAt: existingQueue?.createdAt || new Date().toISOString(),
      notes: `Outbound call triggered on $${dueAmount.toFixed(2)} due balance`,
    };
    await db.upsertQueuedCall(queueRecord, userId);

    return NextResponse.json({
      success: true,
      roomName,
      dispatchId: dispatch.id,
      phoneNumber: formattedPhone,
      debtorName: account.name,
      dueAmount,
      updatedAccount: updatedAccount || account,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to dispatch outbound call' },
      { status: 500 }
    );
  }
}
