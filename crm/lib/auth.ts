import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { mongoDb } from './mongodb';

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb),
  baseURL:
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: (request?: Request) => {
    const allowed = [
      'http://localhost:3000',
      'http://localhost:*',
      'http://127.0.0.1:*',
      'https://*.vercel.app',
      'https://crm-alpha-wheat.vercel.app',
    ];
    if (process.env.BETTER_AUTH_URL) allowed.push(process.env.BETTER_AUTH_URL);
    if (process.env.NEXT_PUBLIC_APP_URL) allowed.push(process.env.NEXT_PUBLIC_APP_URL);
    if (process.env.VERCEL_URL) allowed.push(`https://${process.env.VERCEL_URL}`);
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      allowed.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
    }
    if (request) {
      const origin = request.headers.get('origin');
      if (origin) allowed.push(origin);
      const referer = request.headers.get('referer');
      if (referer) {
        try {
          allowed.push(new URL(referer).origin);
        } catch {}
      }
    }
    return allowed;
  },
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'Recovery Officer',
      },
      organization: {
        type: 'string',
        defaultValue: 'Recovra',
      },
    },
  },
});
