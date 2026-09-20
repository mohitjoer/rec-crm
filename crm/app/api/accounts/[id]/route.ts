import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantFromRequest, unauthorizedResponse, notFoundOrForbiddenResponse } from '@/lib/tenant';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const account = await db.getAccountById(id, tenant.userId);
  if (!account) {
    return notFoundOrForbiddenResponse('Account');
  }
  return NextResponse.json(account);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const body = await req.json();

    // Prevent tampering with userId
    delete body.userId;

    const updated = await db.updateAccount(id, body, tenant.userId);
    if (!updated) {
      return notFoundOrForbiddenResponse('Account');
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
