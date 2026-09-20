import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';

export interface TenantContext {
  userId: string;
  email: string;
  name: string;
  organization?: string;
  role?: string;
}

/**
 * Extracts and validates the authenticated user from request session cookies/headers.
 * Returns TenantContext if authenticated, or null if unauthenticated.
 */
export async function getTenantFromRequest(req: Request | NextRequest): Promise<TenantContext | null> {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return null;
    }
    const u = session.user as any;
    return {
      userId: u.id.toString(),
      email: u.email || '',
      name: u.name || '',
      organization: u.organization || 'Recovra',
      role: u.role || 'Recovery Officer',
    };
  } catch (err) {
    return null;
  }
}

/**
 * Asserts that the request is authenticated with a valid user session.
 * Throws an unauthorized response error if no session is found.
 */
export async function requireTenantFromRequest(req: Request | NextRequest): Promise<TenantContext> {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) {
    throw new Error('UNAUTHORIZED');
  }
  return tenant;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized. You must be signed in to access this resource.' },
    { status: 401 }
  );
}

export function notFoundOrForbiddenResponse(resourceName: string = 'Resource') {
  return NextResponse.json(
    { error: `${resourceName} not found or you do not have permission to access it.` },
    { status: 404 }
  );
}
