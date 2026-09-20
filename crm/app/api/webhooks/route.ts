import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantFromRequest, unauthorizedResponse } from '@/lib/tenant';
import { InboundClientPayload } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return unauthorizedResponse();
    }

    const webhookKey = await db.getWebhookKey(tenant.userId);
    const logs = await db.getWebhookLogs(tenant.userId, 50);

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const webhookUrl = `${proto}://${host}/api/webhooks/incoming`;

    return NextResponse.json({
      webhookUrl,
      webhookKey,
      logs,
      totalReceived: logs.length,
      lastReceivedAt: logs[0]?.timestamp || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch webhook configuration' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return unauthorizedResponse();
    }

    const body = await req.json();
    const action = body.action;

    if (action === 'regenerate_key') {
      const newKey = await db.regenerateWebhookKey(tenant.userId);
      return NextResponse.json({ success: true, webhookKey: newKey });
    }

    if (action === 'test_webhook') {
      const clientPayload: InboundClientPayload = {
        name: (body.payload?.name || 'Jane Doe').trim(),
        email: (body.payload?.email || 'jane.doe@acmecorp.io').trim(),
        phone: (body.payload?.phoneNumber || body.payload?.phone || '+1-555-891-2345').trim(),
        phoneNumber: (body.payload?.phoneNumber || body.payload?.phone || '+1-555-891-2345').trim(),
        country: (body.payload?.country || 'United States').trim(),
        overdueAmount: Number(body.payload?.overdueAmount ?? 1420.00),
        predueAmount: Number(body.payload?.predueAmount ?? 350.00),
        originalCreditor: (body.payload?.originalCreditor || tenant.organization || 'Recovra Client Platform').trim(),
        accountNumber: (body.payload?.accountNumber || `CLI-${Math.floor(100000 + Math.random() * 900000)}`).trim(),
      };

      const result = await db.ingestClientFromWebhook(tenant.userId, clientPayload);

      const responsePayload = {
        success: true,
        testMode: true,
        action: result.action,
        message: result.message,
        account: result.account
          ? {
              id: result.account.id,
              name: result.account.name,
              phone: result.account.phone,
              email: result.account.email,
              country: result.account.country,
              overdueAmount: result.account.overdueAmount,
              predueAmount: result.account.predueAmount,
              currentBalance: result.account.currentBalance,
              status: result.account.status,
              isNew: result.isNew,
              queuedForOutreach: result.queued,
            }
          : null,
      };

      // Add actual log
      const log = await db.addWebhookLog({
        userId: tenant.userId,
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        statusCode: result.action === 'DELETED' ? 200 : result.isNew ? 201 : 200,
        action: result.action,
        clientName: clientPayload.name,
        clientEmail: clientPayload.email,
        clientPhone: clientPayload.phone,
        country: clientPayload.country,
        overdueAmount: clientPayload.overdueAmount,
        predueAmount: clientPayload.predueAmount,
        accountId: result.account?.id,
        payload: clientPayload,
        response: responsePayload,
        sourceIp: 'dashboard-test-runner',
      });

      return NextResponse.json({
        success: true,
        action: result.action,
        message: result.message,
        account: result.account || null,
        isNew: result.isNew,
        queued: result.queued,
        log,
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Webhook operation failed' },
      { status: 500 }
    );
  }
}
