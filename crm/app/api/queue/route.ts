import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { QueuedCall } from '@/lib/types';
import { getTenantFromRequest, unauthorizedResponse, notFoundOrForbiddenResponse } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return unauthorizedResponse();
    }

    const [settings, queuedCalls] = await Promise.all([
      db.getQueueSettings(tenant.userId),
      db.getQueuedCalls(tenant.userId),
    ]);

    // Refresh dynamic status based on current time (e.g. mark overdue QUEUED as DUE, heal stale IN_PROGRESS)
    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    const updatedCalls = await Promise.all(
      queuedCalls.map(async (call) => {
        if (call.status === 'IN_PROGRESS') {
          const attemptTime = new Date(call.lastAttemptAt || call.createdAt).getTime();
          // If in progress for over 30 seconds, verify if call is actually still ongoing
          if (now - attemptTime > 30000) {
            const calls = await db.getCalls(tenant.userId);
            const isCallActive = calls.some(
              (c) => c.accountId === call.accountId && c.status === 'IN_PROGRESS'
            );
            if (!isCallActive) {
              const maxAttempts = call.maxAttempts || settings.maxReattempts || 3;
              const isExhausted = (call.attemptCount || 1) >= maxAttempts;
              const nextStatus = isExhausted ? 'EXHAUSTED' : 'QUEUED';
              const nextAttempt = new Date(
                now + (settings.reattemptIntervalMinutes || 30) * 60 * 1000
              ).toISOString();

              const healed = await db.updateQueuedCall(
                call.id,
                {
                  status: nextStatus,
                  nextAttemptAt: nextAttempt,
                  notes: isExhausted
                    ? 'Max attempts reached'
                    : 'Reattempt queued (previous attempt concluded)',
                },
                tenant.userId
              );
              return healed || { ...call, status: nextStatus };
            }
          }
        }

        if (call.status === 'QUEUED' && call.nextAttemptAt <= nowIso) {
          return { ...call, status: 'DUE' as const };
        }
        return call;
      })
    );

    return NextResponse.json({
      settings,
      queuedCalls: updatedCalls,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch queue' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return unauthorizedResponse();
    }

    const body = await req.json();
    const { action, id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing queued call ID' }, { status: 400 });
    }

    if (action === 'reattempt_now') {
      const queuedCall = await db.getQueuedCallById(id, tenant.userId);
      if (!queuedCall) {
        return notFoundOrForbiddenResponse('Queued call');
      }

      const settings = await db.getQueueSettings(tenant.userId);
      const newAttemptCount = queuedCall.attemptCount + 1;
      const isLastAttempt = newAttemptCount >= settings.maxReattempts;
      const nextDate = new Date(Date.now() + settings.reattemptIntervalMinutes * 60 * 1000).toISOString();

      const updated = await db.updateQueuedCall(
        id,
        {
          attemptCount: newAttemptCount,
          lastAttemptAt: new Date().toISOString(),
          status: isLastAttempt ? 'EXHAUSTED' : 'QUEUED',
          nextAttemptAt: nextDate,
          notes: `Manual reattempt executed. ${isLastAttempt ? 'Max attempts reached.' : `Next reattempt scheduled for ${new Date(nextDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}`,
        },
        tenant.userId
      );

      return NextResponse.json({ success: true, queuedCall: updated });
    }

    if (action === 'cancel') {
      const queuedCall = await db.getQueuedCallById(id, tenant.userId);
      if (!queuedCall) {
        return notFoundOrForbiddenResponse('Queued call');
      }

      await db.updateQueuedCall(
        id,
        {
          status: 'CANCELLED',
          notes: 'Reattempt cancelled by recovery officer.',
        },
        tenant.userId
      );
      return NextResponse.json({ success: true, message: 'Queued call cancelled' });
    }

    if (action === 'dismiss') {
      const queuedCall = await db.getQueuedCallById(id, tenant.userId);
      if (!queuedCall) {
        return notFoundOrForbiddenResponse('Queued call');
      }

      await db.deleteQueuedCall(id, tenant.userId);
      return NextResponse.json({ success: true, message: 'Queued call deleted' });
    }

    if (action === 'reschedule') {
      const queuedCall = await db.getQueuedCallById(id, tenant.userId);
      if (!queuedCall) {
        return notFoundOrForbiddenResponse('Queued call');
      }

      const { nextAttemptAt } = body;
      const updated = await db.updateQueuedCall(
        id,
        {
          nextAttemptAt: nextAttemptAt || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          status: 'QUEUED',
          notes: 'Manually rescheduled.',
        },
        tenant.userId
      );
      return NextResponse.json({ success: true, queuedCall: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 400 });
  }
}
