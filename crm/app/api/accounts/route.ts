import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantFromRequest, unauthorizedResponse } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const bucket = searchParams.get('bucket');
  const query = searchParams.get('q')?.toLowerCase();

  let accounts = await db.getAccounts(tenant.userId);

  if (status && status !== 'ALL') {
    accounts = accounts.filter((a) => a.status === status);
  }
  if (bucket && bucket !== 'ALL') {
    accounts = accounts.filter((a) => a.bucket === bucket);
  }
  if (query) {
    accounts = accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.id.toLowerCase().includes(query) ||
        a.phone.includes(query) ||
        a.originalCreditor.toLowerCase().includes(query)
    );
  }

  const metrics = await db.getMetrics(tenant.userId);
  return NextResponse.json({ accounts, metrics });
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return unauthorizedResponse();
    }

    const body = await req.json();
    const newAccount = {
      ...body,
      userId: tenant.userId,
      id: `ACC-${Math.floor(10000 + Math.random() * 90000)}`,
      notes: body.notes || [],
      riskScore: body.riskScore || 50,
      maxDiscountPercent: body.maxDiscountPercent || 20,
    };
    await db.addAccount(newAccount, tenant.userId);
    return NextResponse.json(newAccount, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
