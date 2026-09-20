import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getDb } from '@/lib/mongodb';
import { getTenantFromRequest, unauthorizedResponse } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return unauthorizedResponse();
    }

    const tables = await db.getDatabaseCollections(tenant.userId);

    return NextResponse.json({
      dbType: 'MongoDB Atlas Cluster',
      connected: true,
      collections: tables.length,
      tables,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return unauthorizedResponse();
    }

    const body = await req.json();
    const database = await getDb();

    let collectionName = 'accounts';
    let filter: Record<string, any> = {};

    if (body.collection && typeof body.collection === 'string') {
      collectionName = body.collection;
    } else if (body.query && typeof body.query === 'string') {
      const q = body.query.trim();
      // Parse simple collection names or JSON filter
      if (q.startsWith('{') && q.endsWith('}')) {
        try {
          filter = JSON.parse(q);
        } catch {
          // ignore
        }
      } else {
        const words = q.split(/[\s.]+/);
        if (words[0]) collectionName = words[0].toLowerCase();
      }
    }

    // Prohibit querying sensitive auth collections
    const allowedCollections = ['accounts', 'calls', 'queued_calls', 'campaigns', 'settings'];
    if (!allowedCollections.includes(collectionName)) {
      return NextResponse.json(
        { error: 'Access to this collection is restricted for multi-tenant security.' },
        { status: 403 }
      );
    }

    // Strictly scope all queries to the authenticated tenant's data
    const scopedFilter: Record<string, any> = { ...filter };
    if (collectionName === 'settings') {
      scopedFilter.id = `user_${tenant.userId}`;
    } else {
      scopedFilter.userId = tenant.userId;
    }

    const safeCollection = database.collection(collectionName);
    const results = await safeCollection.find(scopedFilter).limit(25).toArray();

    // Clean MongoDB _id to string for JSON output
    const cleanResults = results.map((r: any) => {
      const { _id, ...rest } = r;
      return { id: _id?.toString() || rest.id, ...rest };
    });

    return NextResponse.json({ success: true, results: cleanResults, count: cleanResults.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}