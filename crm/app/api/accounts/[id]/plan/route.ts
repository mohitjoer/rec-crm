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

    const { monthlyAmount, months, startDate, total } = await req.json();

    const updated = await db.updateAccount(id, {
      status: 'INSTALLMENT_PLAN',
      paymentPlan: {
        monthlyAmount: Number(monthlyAmount),
        months: Number(months),
        startDate: startDate || new Date().toISOString().split('T')[0],
        remainingBalance: Number(total || account.currentBalance),
      },
    }, account.userId);

    await db.addNote(
      id,
      `Enrolled in ${months}-month payment plan: $${monthlyAmount}/mo starting ${startDate}`,
      'AI Voice Agent',
      account.userId
    );

    return NextResponse.json({ success: true, account: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
