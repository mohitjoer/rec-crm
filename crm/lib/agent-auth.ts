import { createHash, timingSafeEqual } from 'node:crypto';
import { auth } from './auth';

export async function isAgentOrSessionAuthorized(req: Request): Promise<boolean> {
  const apiKey = process.env.CRM_AGENT_API_KEY;
  const token = req.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];

  if (apiKey && token) {
    const expected = createHash('sha256').update(apiKey).digest();
    const supplied = createHash('sha256').update(token).digest();
    if (timingSafeEqual(expected, supplied)) return true;
  }

  const session = await auth.api.getSession({ headers: req.headers });
  return !!session?.user;
}
