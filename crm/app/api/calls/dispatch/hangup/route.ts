import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getLiveKitClients } from '@/lib/livekit-server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const roomName = body?.roomName;
    const accountId = body?.accountId;

    if (!roomName && !accountId) {
      return NextResponse.json({ error: 'roomName or accountId is required' }, { status: 400 });
    }

    if (roomName) {
      const { roomServiceClient } = getLiveKitClients();
      try {
        await roomServiceClient.deleteRoom(roomName);
      } catch {
        // Already deleted or closed
      }
    }

    if (accountId) {
      const { db } = await import('@/lib/db');
      await db.finishInProgressCall(accountId, session.user.id, 'COMPLETED');
    }

    return NextResponse.json({ success: true, status: 'TERMINATED' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to hang up call' }, { status: 500 });
  }
}
