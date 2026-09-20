import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getLiveKitClients } from '@/lib/livekit-server';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roomName = searchParams.get('roomName');

    if (!roomName) {
      return NextResponse.json({ error: 'roomName parameter is required' }, { status: 400 });
    }

    const { roomServiceClient } = getLiveKitClients();

    try {
      const participants = await roomServiceClient.listParticipants(roomName);

      if (!participants || participants.length === 0) {
        return NextResponse.json({ status: 'DIALING', active: true });
      }

      const borrower = participants.find((p) => p.identity.startsWith('borrower'));
      const agent = participants.find((p) => p.identity.includes('agent') || (p as any).isAgent);

      if (borrower) {
        // ParticipantState: 0: JOINING, 1: JOINED, 2: ACTIVE, 3: DISCONNECTED
        const stateStr = String(borrower.state);
        if (stateStr === 'ACTIVE' || stateStr === 'JOINED' || borrower.state === 1 || borrower.state === 2) {
          return NextResponse.json({
            status: 'CONNECTED',
            active: true,
            agentConnected: !!agent,
            joinedAt: borrower.joinedAt,
          });
        }
        return NextResponse.json({
          status: 'RINGING',
          active: true,
          agentConnected: !!agent,
        });
      }

      return NextResponse.json({
        status: 'DIALING',
        active: true,
        agentConnected: !!agent,
      });
    } catch {
      // Room ended or not found
      return NextResponse.json({ status: 'ENDED', active: false });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to get call status' }, { status: 500 });
  }
}
