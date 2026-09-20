import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAgentOrSessionAuthorized } from '@/lib/agent-auth';
import { getTenantFromRequest } from '@/lib/tenant';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAgentOrSessionAuthorized(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tenant = await getTenantFromRequest(req);
    const account = await db.getAccountById(id, tenant?.userId);
    if (!account) {
      return NextResponse.json({ error: 'Account not found or access denied' }, { status: 404 });
    }

    const { category, notes } = await req.json();
    const isHardship = category.includes('HARDSHIP');
    const newStatus = isHardship ? 'HARDSHIP_HOLD' : 'DISPUTED';

    const updated = await db.updateAccount(id, {
      status: newStatus,
    }, account.userId);

    await db.addNote(id, `Flagged [${category}]: ${notes}`, 'AI Voice Agent', account.userId);

    return NextResponse.json({ success: true, account: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
