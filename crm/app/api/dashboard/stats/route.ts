import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantFromRequest, unauthorizedResponse } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return unauthorizedResponse();
    }

    const stats = await db.getDashboardStats(tenant.userId);
    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Failed to get dashboard stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
