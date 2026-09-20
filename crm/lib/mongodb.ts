import { MongoClient, Db } from 'mongodb';
import dns from 'node:dns';

// Ensure IPv4 is prioritized in container networks to prevent IPv6 ENETUNREACH
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

const uri =
  process.env.MONGODB_URI ||
  'mongodb+srv://Vercel-Admin-atlas-citron-school:cNphrvKaTdiDGY1B@atlas-citron-school.9qebpci.mongodb.net/?retryWrites=true&w=majority';

const options = {
  family: 4,
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 30000,
  maxPoolSize: 20,
  minPoolSize: 2,
};


let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Synchronous db handle for Better Auth adapter and immediate queries
const defaultClient = new MongoClient(uri, options);
export const mongoDb: Db = defaultClient.db('collection_crm');

export async function getDb(): Promise<Db> {
  const c = await clientPromise;
  return c.db('collection_crm');
}

export { clientPromise };
