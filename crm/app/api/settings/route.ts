import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantFromRequest, unauthorizedResponse } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return unauthorizedResponse();
    }

    const settings = await db.getQueueSettings(tenant.userId);
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return unauthorizedResponse();
    }

    const body = await req.json();

    const updates: any = {};
    if (typeof body.reattemptIntervalMinutes === 'number' && body.reattemptIntervalMinutes > 0) {
      updates.reattemptIntervalMinutes = Math.round(body.reattemptIntervalMinutes);
    }
    if (typeof body.maxReattempts === 'number' && body.maxReattempts > 0) {
      updates.maxReattempts = Math.round(body.maxReattempts);
    }
    if (typeof body.companyName === 'string') {
      const trimmed = body.companyName.trim();
      updates.companyName = trimmed || 'Recovra';
      updates.brandName = trimmed || 'Recovra';
    } else if (typeof body.brandName === 'string') {
      const trimmed = body.brandName.trim();
      updates.companyName = trimmed || 'Recovra';
      updates.brandName = trimmed || 'Recovra';
    }
    if (typeof body.autoReattemptEnabled === 'boolean') {
      updates.autoReattemptEnabled = body.autoReattemptEnabled;
    }
    if (typeof body.customPrompt === 'string') {
      updates.customPrompt = body.customPrompt;
    }
    if (typeof body.greetingTemplate === 'string') {
      updates.greetingTemplate = body.greetingTemplate;
    }

    const updated = await db.updateQueueSettings(updates, tenant.userId);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 400 });
  }
}

