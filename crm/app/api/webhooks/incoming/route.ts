import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { InboundClientPayload } from '@/lib/types';

// CORS response helper
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-webhook-secret, x-api-key',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const sourceIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'external';

  // 1. Authenticate via Bearer Token, Custom Header, or URL Query
  let key = '';
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    key = authHeader.slice(7).trim();
  } else if (req.headers.get('x-webhook-secret')) {
    key = req.headers.get('x-webhook-secret')!.trim();
  } else if (req.headers.get('x-api-key')) {
    key = req.headers.get('x-api-key')!.trim();
  } else {
    const { searchParams } = new URL(req.url);
    key = (searchParams.get('key') || searchParams.get('secret') || '').trim();
  }

  if (!key) {
    return NextResponse.json(
      {
        error: 'Missing authentication. Pass your Webhook Secret via Authorization: Bearer <KEY> or x-webhook-secret header.',
        code: 'UNAUTHORIZED',
      },
      { status: 401, headers: corsHeaders() }
    );
  }

  const userId = await db.getUserIdByWebhookKey(key);
  if (!userId) {
    return NextResponse.json(
      {
        error: 'Invalid Webhook Secret Key. Verify your secret in the Webhooks section.',
        code: 'INVALID_CREDENTIALS',
      },
      { status: 401, headers: corsHeaders() }
    );
  }

  // 2. Parse Incoming Payload
  let rawBody: any;
  try {
    rawBody = await req.json();
  } catch (err: any) {
    await db.addWebhookLog({
      userId,
      timestamp: new Date().toISOString(),
      status: 'FAILED',
      statusCode: 400,
      payload: {},
      response: { error: 'Invalid JSON payload' },
      error: 'Malformed JSON payload',
      sourceIp,
    });

    return NextResponse.json(
      { error: 'Malformed JSON payload. Expected valid application/json body.', code: 'BAD_REQUEST' },
      { status: 400, headers: corsHeaders() }
    );
  }

  // Support batch or single item ingestion
  const items: InboundClientPayload[] = Array.isArray(rawBody)
    ? rawBody
    : Array.isArray(rawBody.clients)
    ? rawBody.clients
    : Array.isArray(rawBody.data)
    ? rawBody.data
    : [rawBody];

  if (items.length === 0) {
    return NextResponse.json(
      { error: 'Payload must contain at least one client record.', code: 'EMPTY_PAYLOAD' },
      { status: 400, headers: corsHeaders() }
    );
  }

  const results: any[] = [];
  const errors: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Normalize field variations (e.g. name / clientName / debtorName)
    const name = item.name || (item as any).clientName || (item as any).debtorName || (item as any).fullName;
    const phone = item.phoneNumber || item.phone || (item as any).mobile || (item as any).cell;
    const email = item.email || (item as any).clientEmail || '';
    const country = item.country || item.countryCode || (item as any).nation || 'United States';
    const overdueAmount = Number(
      item.overdueAmount ?? (item as any).overdue_amount ?? (item as any).overdue ?? (item as any).overdue_balance ?? 0
    );
    const predueAmount = Number(
      item.predueAmount ?? (item as any).predue_amount ?? (item as any).predue ?? (item as any).upcoming_due ?? 0
    );

    // Extract metadata and user id
    const externalUserId = (
      item.metadata?.userId ||
      (item.metadata as any)?.user_id ||
      item.externalUserId ||
      (item as any)?.user_id ||
      (item as any)?.userId ||
      ''
    ).toString().trim();

    const metadata = item.metadata || (externalUserId ? { userId: externalUserId } : undefined);

    if (!name && !externalUserId && !item.accountNumber && !phone && !email) {
      errors.push(`Record ${i + 1}: Missing client identifier (name, metadata.userId, or contact).`);
      continue;
    }

    try {
      const normalizedPayload: InboundClientPayload = {
        name: name || 'Client Debtor',
        email,
        phone,
        phoneNumber: phone,
        country,
        overdueAmount,
        predueAmount,
        accountNumber: item.accountNumber || (item as any).account_number,
        originalCreditor: item.originalCreditor || (item as any).creditor,
        externalUserId: externalUserId || undefined,
        metadata,
      };

      const result = await db.ingestClientFromWebhook(userId, normalizedPayload);
      results.push({
        id: result.account?.id || 'N/A',
        name: result.account?.name || name,
        phone: result.account?.phone || phone,
        email: result.account?.email || email,
        country: result.account?.country || country,
        overdueAmount,
        predueAmount,
        currentBalance: result.account?.currentBalance ?? 0,
        status: result.action === 'DELETED' ? 'DELETED' : (result.account?.status || 'ACTIVE'),
        action: result.action,
        isNew: result.isNew,
        queuedForOutreach: result.queued || false,
        message: result.message,
      });
    } catch (err: any) {
      errors.push(`Record ${i + 1}: ${err.message || 'Ingestion failed'}`);
    }
  }

  const durationMs = Date.now() - startTime;
  const isSuccess = results.length > 0;
  const statusCode = isSuccess ? (results.some((r) => r.isNew) ? 201 : 200) : 400;

  const firstResult = results[0];
  const responseData = {
    success: isSuccess,
    count: results.length,
    processed: results,
    errors: errors.length > 0 ? errors : undefined,
    executionTimeMs: durationMs,
  };

  // 3. Log the Webhook Event into MongoDB
  await db.addWebhookLog({
    userId,
    timestamp: new Date().toISOString(),
    status: isSuccess ? 'SUCCESS' : 'FAILED',
    statusCode,
    action: firstResult?.action,
    clientName: firstResult ? (results.length === 1 ? firstResult.name : `${firstResult.name} (+${results.length - 1} more)`) : undefined,
    clientEmail: firstResult?.email,
    clientPhone: firstResult?.phone,
    country: firstResult?.country,
    overdueAmount: firstResult?.overdueAmount,
    predueAmount: firstResult?.predueAmount,
    accountId: firstResult?.id !== 'N/A' ? firstResult?.id : undefined,
    payload: rawBody,
    response: responseData,
    error: errors.length > 0 ? errors.join('; ') : undefined,
    sourceIp,
  });

  return NextResponse.json(responseData, {
    status: statusCode,
    headers: corsHeaders(),
  });
}
