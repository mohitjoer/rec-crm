import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CallRecord } from '@/lib/types';
import { getTenantFromRequest, unauthorizedResponse } from '@/lib/tenant';
import { isAgentOrSessionAuthorized } from '@/lib/agent-auth';
import { sendPostCallDebtorEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) {
    return unauthorizedResponse();
  }

  const calls = await db.getCalls(tenant.userId);
  return NextResponse.json({ calls });
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAgentOrSessionAuthorized(req))) {
      return unauthorizedResponse();
    }

    const tenant = await getTenantFromRequest(req);
    const body = await req.json();

    // Resolve owner tenant userId from associated account
    let resolvedUserId = tenant?.userId;
    let account = null;
    if (body.accountId) {
      account = await db.getAccountById(body.accountId);
      if (account?.userId) {
        resolvedUserId = account.userId;
      }
    }

    const newCall: CallRecord = {
      id: `CALL-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: resolvedUserId,
      accountId: body.accountId,
      debtorName: body.debtorName,
      startTime: body.startTime || new Date().toISOString(),
      durationSeconds: body.durationSeconds || 120,
      status: body.status || 'COMPLETED',
      disposition: body.disposition || 'PROMISE_TO_PAY',
      sentiment: body.sentiment || 'POSITIVE',
      complianceScore: body.complianceScore || 99,
      miniMirandaPassed: body.miniMirandaPassed !== undefined ? body.miniMirandaPassed : true,
      transcript: body.transcript || [],
      summary: body.summary || 'Call handled by AI Voice Agent.',
      amountPromised: body.amountPromised,
      promisedDate: body.promisedDate,
    };

    await db.addCall(newCall, resolvedUserId);

    if (body.disposition === 'PROMISE_TO_PAY' && body.amountPromised && body.promisedDate) {
      await db.recordPromiseToPay(body.accountId, body.amountPromised, body.promisedDate, 'Scheduled Debit', resolvedUserId);
    }

    // Send formal post-call summary email to debtor if email is registered on account
    if (account && account.email) {
      const settings = await db.getQueueSettings(resolvedUserId);
      const companyName = settings.brandName || settings.companyName || 'Recovra';
      sendPostCallDebtorEmail({
        account,
        call: newCall,
        companyName,
      }).catch((err) => {
        console.error('[PostCallEmail] Failed to dispatch post-call email:', err?.message || err);
      });
    }

    return NextResponse.json(newCall, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
