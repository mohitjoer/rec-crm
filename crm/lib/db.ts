import crypto from 'crypto';
import { getDb } from './mongodb';
import { DebtorDocument } from './mongo';
import {
  Account,
  CallRecord,
  Campaign,
  Note,
  QueueSettings,
  QueuedCall,
  DashboardStats,
  WebhookLog,
  InboundClientPayload,
} from './types';

function cleanDoc<T>(doc: any): T {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest as T;
}

export async function connectMongoDb() {
  return getDb();
}

export async function closeMongoDb() {
  // Managed by client pool in mongodb.ts
}

export const db = {
  getAccounts: async (userId?: string): Promise<Account[]> => {
    const database = await getDb();
    const query = userId ? { userId } : {};
    const rows = await database
      .collection<Account>('accounts')
      .find(query)
      .sort({ createdAt: -1 as any })
      .toArray();
    return rows.map(cleanDoc<Account>);
  },

  getAccountById: async (id: string, userId?: string): Promise<Account | null> => {
    const database = await getDb();
    const query = userId ? { id, userId } : { id };
    const row = await database.collection<Account>('accounts').findOne(query);
    return row ? cleanDoc<Account>(row) : null;
  },

  updateAccount: async (id: string, updates: Partial<Account>, userId?: string): Promise<Account | null> => {
    const database = await getDb();
    const query = userId ? { id, userId } : { id };
    const result = await database.collection<Account>('accounts').findOneAndUpdate(
      query,
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result ? cleanDoc<Account>(result) : null;
  },

  addAccount: async (account: Account, userId?: string): Promise<Account> => {
    const database = await getDb();
    const toInsert = {
      ...account,
      userId: userId || account.userId,
    };
    await database.collection<Account>('accounts').insertOne(toInsert as any);
    return toInsert;
  },

  addNote: async (accountId: string, noteText: string, author: string = 'Agent', userId?: string): Promise<Note | null> => {
    const acc = await db.getAccountById(accountId, userId);
    if (!acc) return null;

    const note: Note = {
      id: `n-${Date.now()}`,
      text: noteText,
      date: new Date().toISOString().split('T')[0],
      author,
    };

    const updatedNotes = [note, ...(acc.notes || [])];
    await db.updateAccount(accountId, { notes: updatedNotes }, userId);
    return note;
  },

  recordPromiseToPay: async (
    accountId: string,
    amount: number,
    date: string,
    method: string,
    userId?: string
  ): Promise<Account | null> => {
    const acc = await db.getAccountById(accountId, userId);
    if (!acc) return null;

    const newNote: Note = {
      id: `n-${Date.now()}`,
      text: `Promise to Pay scheduled: $${amount.toFixed(2)} on ${date} via ${method}`,
      date: new Date().toISOString().split('T')[0],
      author: 'AI Voice Agent',
    };

    return db.updateAccount(accountId, {
      status: 'PROMISE_TO_PAY',
      nextActionDate: date,
      promiseToPay: {
        amount,
        date,
        method,
        status: 'PENDING',
      },
      notes: [newNote, ...(acc.notes || [])],
    }, userId);
  },

  getCalls: async (userId?: string): Promise<CallRecord[]> => {
    const database = await getDb();
    const query = userId ? { userId } : {};
    const rows = await database
      .collection<CallRecord>('calls')
      .find(query)
      .sort({ startTime: -1 })
      .toArray();
    return rows.map(cleanDoc<CallRecord>);
  },

  getCallById: async (id: string, userId?: string): Promise<CallRecord | null> => {
    const database = await getDb();
    const query = userId ? { id, userId } : { id };
    const row = await database.collection<CallRecord>('calls').findOne(query);
    return row ? cleanDoc<CallRecord>(row) : null;
  },

  addCall: async (call: CallRecord, userId?: string): Promise<CallRecord> => {
    const database = await getDb();

    // If userId not provided, look up debtor account to inherit owner userId
    let resolvedUserId = userId || call.userId;
    let account = null;
    if (call.accountId) {
      account = await db.getAccountById(call.accountId);
      if (account?.userId && !resolvedUserId) {
        resolvedUserId = account.userId;
      }
    }

    // If an IN_PROGRESS call already exists for this account, update it rather than inserting duplicate
    const toInsert: CallRecord = { ...call, userId: resolvedUserId };
    let isUpdated = false;
    if (call.accountId && call.status !== 'IN_PROGRESS') {
      const existingInProgress = await database.collection<CallRecord>('calls').findOne({
        accountId: call.accountId,
        status: 'IN_PROGRESS',
        ...(resolvedUserId ? { userId: resolvedUserId } : {}),
      });

      if (existingInProgress) {
        await database.collection<CallRecord>('calls').updateOne(
          { id: existingInProgress.id },
          {
            $set: {
              status: call.status,
              disposition: call.disposition,
              durationSeconds: call.durationSeconds,
              sentiment: call.sentiment,
              complianceScore: call.complianceScore,
              miniMirandaPassed: call.miniMirandaPassed,
              transcript: call.transcript,
              summary: call.summary,
              amountPromised: call.amountPromised,
              promisedDate: call.promisedDate,
            },
          }
        );
        toInsert.id = existingInProgress.id;
        isUpdated = true;
      }
    }

    if (!isUpdated) {
      await database.collection<CallRecord>('calls').insertOne(toInsert as any);
    }

    // Update account last contact date
    if (call.accountId) {
      await db.updateAccount(call.accountId, {
        lastContactDate: new Date().toISOString().split('T')[0],
      }, resolvedUserId);
    }

    // Reconcile and synchronize queued_calls for this account
    try {
      const settings = await db.getQueueSettings(resolvedUserId);
      const isResolved =
        call.status === 'COMPLETED' &&
        (call.disposition === 'PROMISE_TO_PAY' ||
          call.disposition === 'PAYMENT_PLAN' ||
          call.disposition === 'SETTLEMENT_OFFERED');

      const existingQueue = await database
        .collection<QueuedCall>('queued_calls')
        .findOne({ accountId: call.accountId, ...(resolvedUserId ? { userId: resolvedUserId } : {}) });

      if (isResolved) {
        // Resolve all queue records for this account
        await database.collection('queued_calls').updateMany(
          { accountId: call.accountId, ...(resolvedUserId ? { userId: resolvedUserId } : {}) },
          { $set: { status: 'COMPLETED', notes: `Resolved via ${call.disposition.replace(/_/g, ' ')}` } }
        );
      } else if (existingQueue) {
        // Unresolved attempt (FAILED, NO_ANSWER, VOICEMAIL, CALL_BACK, etc.)
        const maxAttempts = existingQueue.maxAttempts || settings.maxReattempts || 3;
        const currentAttemptCount = existingQueue.attemptCount || 1;
        const intervalMins = settings.reattemptIntervalMinutes || 30;

        if (settings.autoReattemptEnabled && currentAttemptCount < maxAttempts) {
          const nextAttemptDate = new Date(Date.now() + intervalMins * 60 * 1000);
          await database.collection('queued_calls').updateOne(
            { id: existingQueue.id },
            {
              $set: {
                status: 'QUEUED',
                lastAttemptAt: call.startTime || new Date().toISOString(),
                lastDisposition: call.disposition,
                nextAttemptAt: nextAttemptDate.toISOString(),
                notes:
                  call.status === 'FAILED'
                    ? 'Reattempt scheduled after carrier failure'
                    : `Auto-scheduled reattempt after ${call.disposition.replace(/_/g, ' ').toLowerCase()}`,
              },
            }
          );
        } else {
          await database.collection('queued_calls').updateOne(
            { id: existingQueue.id },
            {
              $set: {
                status: 'EXHAUSTED',
                lastAttemptAt: call.startTime || new Date().toISOString(),
                lastDisposition: call.disposition,
                notes:
                  call.status === 'FAILED'
                    ? 'Carrier connection failed (call rejected)'
                    : 'Max reattempt limit reached.',
              },
            }
          );
        }
      }
    } catch (err) {
      console.error('Failed to synchronize queued call on addCall:', err);
    }

    return toInsert;
  },

  finishInProgressCall: async (
    accountId?: string,
    userId?: string,
    status: 'COMPLETED' | 'FAILED' = 'COMPLETED'
  ): Promise<void> => {
    const database = await getDb();
    const query: any = { status: 'IN_PROGRESS' };
    if (accountId) query.accountId = accountId;
    if (userId) query.userId = userId;

    await database.collection<CallRecord>('calls').updateMany(query, {
      $set: {
        status,
        durationSeconds: 15,
        disposition: status === 'COMPLETED' ? 'CALL_BACK' : 'NO_ANSWER',
      },
    });

    const queueQuery: any = { status: 'IN_PROGRESS' };
    if (accountId) queueQuery.accountId = accountId;
    if (userId) queueQuery.userId = userId;

    await database.collection<QueuedCall>('queued_calls').updateMany(queueQuery, {
      $set: {
        status: status === 'COMPLETED' ? 'COMPLETED' : 'QUEUED',
        lastAttemptAt: new Date().toISOString(),
      },
    });
  },

  getCampaigns: async (userId?: string): Promise<Campaign[]> => {
    const database = await getDb();
    const query = userId ? { userId } : {};
    const rows = await database.collection<Campaign>('campaigns').find(query).toArray();
    return rows.map(cleanDoc<Campaign>);
  },

  updateCampaign: async (id: string, updates: Partial<Campaign>, userId?: string): Promise<Campaign | null> => {
    const database = await getDb();
    const query = userId ? { id, userId } : { id };
    const result = await database.collection<Campaign>('campaigns').findOneAndUpdate(
      query,
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result ? cleanDoc<Campaign>(result) : null;
  },

  getMetrics: async (userId?: string) => {
    const [accounts, calls] = await Promise.all([db.getAccounts(userId), db.getCalls(userId)]);

    const totalOutstanding = accounts.reduce((acc, a) => acc + (a.currentBalance || 0), 0);
    const totalPtp = accounts
      .filter((a) => a.status === 'PROMISE_TO_PAY' && a.promiseToPay)
      .reduce((acc, a) => acc + (a.promiseToPay?.amount || 0), 0);
    const activeCount = accounts.filter((a) => a.status !== 'SETTLED').length;
    const settledCount = accounts.filter((a) => a.status === 'SETTLED').length;
    const ptpCount = accounts.filter((a) => a.status === 'PROMISE_TO_PAY').length;

    // Compliance calculation
    const complianceScores = calls
      .map((c) => c.complianceScore)
      .filter((s) => typeof s === 'number' && !isNaN(s));
    const averageCompliance =
      complianceScores.length > 0
        ? Number((complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length).toFixed(1))
        : 100.0;

    // Average duration
    const durations = calls
      .map((c) => c.durationSeconds)
      .filter((d) => typeof d === 'number' && !isNaN(d));
    const averageDurationSeconds =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

    // Mini-Miranda pass rate
    const miniMirandaPassedCount = calls.filter((c) => c.miniMirandaPassed).length;
    const miniMirandaPassRate =
      calls.length > 0 ? Math.round((miniMirandaPassedCount / calls.length) * 100) : 100;

    // Recovery rate from balances
    const totalOriginal = accounts.reduce((acc, a) => acc + (a.originalBalance || 0), 0);
    const totalRecovered = accounts.reduce(
      (acc, a) => acc + Math.max(0, (a.originalBalance || 0) - (a.currentBalance || 0)),
      0
    );
    const recoveryRate =
      totalOriginal > 0 ? Number(((totalRecovered / totalOriginal) * 100).toFixed(1)) : 0;

    // Dynamic Delinquency Buckets
    const bucketDefs = [
      { id: '30_DPD', label: '30 DPD (Early Delinquency)', color: 'bg-zinc-200' },
      { id: '60_DPD', label: '60 DPD (Mid-Stage)', color: 'bg-zinc-400' },
      { id: '90_DPD', label: '90 DPD (Late-Stage)', color: 'bg-zinc-500' },
      { id: '120_PLUS_DPD', label: '120+ DPD (Pre-Chargeoff)', color: 'bg-zinc-600' },
    ];

    const maxBucketTotal = Math.max(
      ...bucketDefs.map((b) =>
        accounts.filter((a) => a.bucket === b.id).reduce((sum, a) => sum + (a.currentBalance || 0), 0)
      ),
      1
    );

    const bucketSummary = bucketDefs.map((b) => {
      const inBucket = accounts.filter((a) => a.bucket === b.id);
      const amount = inBucket.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
      const widthPct = Math.max(10, Math.round((amount / maxBucketTotal) * 100));
      return {
        id: b.id,
        label: b.label,
        count: inBucket.length,
        amount,
        color: b.color,
        bar: `w-[${widthPct}%]`,
      };
    });

    return {
      totalOutstanding,
      totalPtp,
      activeCount,
      settledCount,
      ptpCount,
      totalCalls: calls.length,
      averageCompliance,
      averageDurationSeconds,
      miniMirandaPassRate,
      recoveryRate,
      bucketSummary,
    };
  },

  getDatabaseCollections: async (userId?: string) => {
    const database = await getDb();
    const collectionInfos = await database.listCollections().toArray();

    const domainNames = ['accounts', 'calls', 'queued_calls', 'campaigns', 'settings'];

    const result = await Promise.all(
      domainNames.map(async (name) => {
        const col = database.collection(name);
        let filter: any = {};
        if (userId) {
          if (name === 'settings') {
            filter = { id: `user_${userId}` };
          } else {
            filter = { userId };
          }
        }

        const [count, sample] = await Promise.all([
          col.countDocuments(filter).catch(() => 0),
          col.find(filter).limit(5).toArray().catch(() => []),
        ]);

        const columnKeys = new Set<string>();
        sample.forEach((doc) => Object.keys(doc).forEach((k) => columnKeys.add(k)));

        const columns = Array.from(columnKeys).map((colName) => ({
          cid: 0,
          name: colName,
          type: colName === '_id' ? 'ObjectId' : typeof (sample[0] as any)?.[colName],
          notnull: colName === '_id' ? 1 : 0,
          dflt_value: null,
          pk: colName === '_id' ? 1 : 0,
        }));

        return {
          tableName: name,
          rowCount: count,
          columns,
          sampleRows: sample.map(cleanDoc),
        };
      })
    );

    return result;
  },

  getQueueSettings: async (userId?: string): Promise<QueueSettings> => {
    const database = await getDb();
    const settingId = userId ? `user_${userId}` : 'global';
    const row = await database.collection<QueueSettings>('settings').findOne({ id: settingId });
    if (row) return cleanDoc<QueueSettings>(row);

    // Fallback check: if user-specific not created, check global template
    let brandName = 'Recovra';
    let companyName = 'Recovra';
    if (userId) {
      const globalRow = await database.collection<QueueSettings>('settings').findOne({ id: 'global' });
      if (globalRow) {
        brandName = globalRow.brandName || brandName;
        companyName = globalRow.companyName || companyName;
      }
    }

    const defaultSettings: QueueSettings = {
      id: settingId,
      userId,
      brandName,
      companyName,
      reattemptIntervalMinutes: 60,
      maxReattempts: 3,
      autoReattemptEnabled: true,
      updatedAt: new Date().toISOString(),
    };
    await database.collection<QueueSettings>('settings').insertOne(defaultSettings as any);
    return defaultSettings;
  },

  updateQueueSettings: async (updates: Partial<QueueSettings>, userId?: string): Promise<QueueSettings> => {
    const database = await getDb();
    const settingId = userId ? `user_${userId}` : 'global';
    const existing = await db.getQueueSettings(userId);
    const merged: QueueSettings = {
      ...existing,
      ...updates,
      userId,
      updatedAt: new Date().toISOString(),
    };
    await database.collection<QueueSettings>('settings').updateOne(
      { id: settingId },
      { $set: merged },
      { upsert: true }
    );
    return merged;
  },

  getQueuedCalls: async (userId?: string): Promise<QueuedCall[]> => {
    const database = await getDb();
    const query = userId ? { userId } : {};
    const rows = await database
      .collection<QueuedCall>('queued_calls')
      .find(query)
      .sort({ nextAttemptAt: 1 })
      .toArray();
    return rows.map(cleanDoc<QueuedCall>);
  },

  getQueuedCallById: async (id: string, userId?: string): Promise<QueuedCall | null> => {
    const database = await getDb();
    const query = userId ? { id, userId } : { id };
    const row = await database.collection<QueuedCall>('queued_calls').findOne(query);
    return row ? cleanDoc<QueuedCall>(row) : null;
  },

  upsertQueuedCall: async (queuedCall: QueuedCall, userId?: string): Promise<QueuedCall> => {
    const database = await getDb();
    const toInsert = {
      ...queuedCall,
      userId: userId || queuedCall.userId,
    };
    const query = userId ? { id: queuedCall.id, userId } : { id: queuedCall.id };
    await database.collection<QueuedCall>('queued_calls').updateOne(
      query,
      { $set: toInsert },
      { upsert: true }
    );
    return toInsert;
  },

  updateQueuedCall: async (id: string, updates: Partial<QueuedCall>, userId?: string): Promise<QueuedCall | null> => {
    const database = await getDb();
    const query = userId ? { id, userId } : { id };
    const result = await database.collection<QueuedCall>('queued_calls').findOneAndUpdate(
      query,
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result ? cleanDoc<QueuedCall>(result) : null;
  },

  deleteQueuedCall: async (id: string, userId?: string): Promise<boolean> => {
    const database = await getDb();
    const query = userId ? { id, userId } : { id };
    const result = await database.collection('queued_calls').deleteOne(query);
    return (result.deletedCount || 0) > 0;
  },

  getDashboardStats: async (userId?: string): Promise<DashboardStats> => {
    const [calls, accounts, queuedCalls] = await Promise.all([
      db.getCalls(userId),
      db.getAccounts(userId),
      db.getQueuedCalls(userId),
    ]);

    // 30-day daily trend calculation
    const daysCount = 30;
    const now = new Date();
    const dailyMap = new Map<string, number>();
    const datesList: Array<{ day: string; date: string }> = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyMap.set(dateStr, 0);
      datesList.push({ day: dayLabel, date: dateStr });
    }

    for (const call of calls) {
      if (call.startTime) {
        const callDate = call.startTime.slice(0, 10);
        if (dailyMap.has(callDate)) {
          dailyMap.set(callDate, (dailyMap.get(callDate) || 0) + 1);
        }
      }
    }

    const dailyTrend = datesList.map(({ day, date }) => ({
      day,
      date,
      value: dailyMap.get(date) || 0,
    }));

    const counts = dailyTrend.map((d) => d.value);
    const peak = counts.length > 0 ? Math.max(...counts) : 0;
    const totalInWindow = counts.reduce((a, b) => a + b, 0);
    const activeDays = counts.filter((c) => c > 0).length;
    const avgPerDay = activeDays > 0 ? Number((totalInWindow / activeDays).toFixed(1)) : 0;

    // Channel breakdown
    const voiceCount = calls.length;
    let messageCount = 0;
    for (const call of calls) {
      if (call.disposition === 'PROMISE_TO_PAY' || call.amountPromised) {
        messageCount++;
      }
    }
    for (const acc of accounts) {
      if (acc.promiseToPay && acc.promiseToPay.amount > 0) {
        messageCount++;
      }
      if (acc.notes) {
        for (const note of acc.notes) {
          const lower = note.text.toLowerCase();
          if (lower.includes('sms') || lower.includes('message')) {
            messageCount++;
          }
        }
      }
    }

    let emailCount = 0;
    for (const acc of accounts) {
      if (acc.notes) {
        for (const note of acc.notes) {
          if (note.text.toLowerCase().includes('email')) {
            emailCount++;
          }
        }
      }
    }
    const channelTotal = voiceCount + messageCount + emailCount;

    // Outreach outcome
    let completed = 0;
    let responded = 0;
    let notResponded = 0;

    for (const call of calls) {
      if (call.status === 'COMPLETED') {
        completed++;
      }
      if (
        call.disposition !== 'NO_ANSWER' &&
        call.disposition !== 'VOICEMAIL' &&
        call.status !== 'FAILED'
      ) {
        responded++;
      } else {
        notResponded++;
      }
    }

    const pendingQueue = queuedCalls.filter(
      (q) => q.status === 'QUEUED' || q.status === 'DUE' || q.status === 'IN_PROGRESS'
    ).length;
    notResponded += pendingQueue;
    const totalSessions = completed + notResponded;

    // Portfolio summary
    const totalAccounts = accounts.length;
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
    const totalOverdue = accounts
      .filter((acc) => acc.daysPastDue >= 30 && acc.status !== 'SETTLED')
      .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
    const promisedAmount = accounts
      .filter((acc) => acc.status === 'PROMISE_TO_PAY' && acc.promiseToPay)
      .reduce((sum, acc) => sum + (acc.promiseToPay?.amount || 0), 0);
    const queuedCallsCount = queuedCalls.length;

    return {
      dailyTrend,
      trendSummary: {
        total: totalInWindow,
        avgPerDay,
        peak,
        daysCount,
      },
      channelBreakdown: {
        voice: voiceCount,
        message: messageCount,
        email: emailCount,
        total: channelTotal,
      },
      outreachOutcome: {
        completed,
        responded,
        notResponded,
        totalSessions,
      },
      portfolioSummary: {
        totalAccounts,
        totalBalance,
        totalOverdue,
        promisedAmount,
        queuedCallsCount,
      },
    };
  },

  getWebhookKey: async (userId: string): Promise<string> => {
    const database = await getDb();
    const settingId = `user_${userId}`;
    const row = await database.collection<QueueSettings>('settings').findOne({ id: settingId });
    if (row?.webhookKey) {
      return row.webhookKey;
    }
    const newKey = `whsec_live_${crypto.randomBytes(16).toString('hex')}`;
    await database.collection('settings').updateOne(
      { id: settingId },
      { $set: { webhookKey: newKey, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    return newKey;
  },

  regenerateWebhookKey: async (userId: string): Promise<string> => {
    const database = await getDb();
    const settingId = `user_${userId}`;
    const newKey = `whsec_live_${crypto.randomBytes(16).toString('hex')}`;
    await database.collection('settings').updateOne(
      { id: settingId },
      { $set: { webhookKey: newKey, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    return newKey;
  },

  getUserIdByWebhookKey: async (key: string): Promise<string | null> => {
    if (!key || typeof key !== 'string') return null;
    const database = await getDb();
    const row = await database.collection<QueueSettings>('settings').findOne({ webhookKey: key.trim() });
    if (!row) return null;
    return row.userId || row.id.replace('user_', '') || null;
  },

  addWebhookLog: async (log: Omit<WebhookLog, 'id'>): Promise<WebhookLog> => {
    const database = await getDb();
    const id = `whlog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const fullLog: WebhookLog = {
      id,
      ...log,
    };
    await database.collection<WebhookLog>('webhook_logs').insertOne(fullLog as any);
    return fullLog;
  },

  getWebhookLogs: async (userId: string, limit = 50): Promise<WebhookLog[]> => {
    const database = await getDb();
    const rows = await database
      .collection<WebhookLog>('webhook_logs')
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    return rows.map(cleanDoc<WebhookLog>);
  },

  ingestClientFromWebhook: async (
    userId: string,
    client: InboundClientPayload
  ): Promise<{
    account?: Account;
    isNew: boolean;
    action: 'CREATED' | 'UPDATED' | 'DELETED' | 'SKIPPED';
    queued?: boolean;
    message?: string;
  }> => {
    const database = await getDb();
    const name = (client.name || 'Client Debtor').trim();
    const email = (client.email || '').trim().toLowerCase();
    const rawPhone = (client.phoneNumber || client.phone || '').trim();
    const phone = rawPhone || '+1-000-000-0000';
    const country = (client.country || client.countryCode || 'United States').trim();
    const overdueAmount = Number(client.overdueAmount || 0);
    const predueAmount = Number(client.predueAmount || 0);
    const totalBalance = Math.max(0, overdueAmount + predueAmount);

    const externalUserId = (
      client.metadata?.userId ||
      (client.metadata as any)?.user_id ||
      client.externalUserId ||
      (client as any)?.user_id ||
      (client as any)?.userId ||
      ''
    ).toString().trim();

    const metadata = client.metadata || (externalUserId ? { userId: externalUserId } : undefined);

    // Multi-tenant search: check if account already exists for this tenant
    const queryConditions: any[] = [];
    if (externalUserId) {
      queryConditions.push({ externalUserId });
      queryConditions.push({ 'metadata.userId': externalUserId });
    }
    if (client.accountNumber) queryConditions.push({ accountNumber: client.accountNumber });
    if (rawPhone) queryConditions.push({ phone: rawPhone });
    if (email) queryConditions.push({ email });

    let existing: Account | null = null;
    if (queryConditions.length > 0) {
      const found = await database.collection<Account>('accounts').findOne({
        userId,
        $or: queryConditions,
      });
      if (found) existing = cleanDoc<Account>(found);
    }

    // 1. If both amounts are 0 (or less), remove the record and cancel queued calls
    if (overdueAmount <= 0 && predueAmount <= 0) {
      if (existing) {
        await database.collection('accounts').deleteOne({ id: existing.id, userId });
        await database.collection('queued_calls').deleteMany({ accountId: existing.id, userId });

        return {
          account: existing,
          isNew: false,
          action: 'DELETED',
          queued: false,
          message: `Both amounts are $0.00. Debtor account ${existing.id} (${existing.name}) and active queued calls were removed.`,
        };
      }

      return {
        isNew: false,
        action: 'SKIPPED',
        queued: false,
        message: 'Both overdue and pre-due amounts are $0.00. Record skipped; no debtor created.',
      };
    }

    const settings = await db.getQueueSettings(userId);
    const creditorName = client.originalCreditor?.trim() || settings.companyName || settings.brandName || 'Recovra Portfolio';

    let account: Account;
    let isNew = false;
    let action: 'CREATED' | 'UPDATED' = 'CREATED';

    if (existing) {
      // 2. Update existing account
      action = 'UPDATED';
      const updatedNotes = [
        {
          id: `n-${Date.now()}`,
          text: `Webhook sync update: Overdue set to $${overdueAmount.toFixed(2)}, Pre-due $${predueAmount.toFixed(2)}${externalUserId ? `, User ID: ${externalUserId}` : ''}.`,
          date: new Date().toISOString().split('T')[0],
          author: 'Inbound Webhook',
        },
        ...(existing.notes || []),
      ];

      const updates: Partial<Account> = {
        name: name || existing.name,
        email: email || existing.email,
        phone: phone || existing.phone,
        country: country || existing.country,
        overdueAmount,
        predueAmount,
        currentBalance: overdueAmount > 0 ? overdueAmount : totalBalance,
        lastContactDate: new Date().toISOString().split('T')[0],
        notes: updatedNotes,
      };

      if (externalUserId) {
        updates.externalUserId = externalUserId;
      }
      if (metadata) {
        updates.metadata = { ...(existing.metadata || {}), ...metadata };
      }
      if (client.accountNumber) {
        updates.accountNumber = client.accountNumber;
      }
      if (client.originalCreditor) {
        updates.originalCreditor = client.originalCreditor;
      }

      const updated = await database.collection<Account>('accounts').findOneAndUpdate(
        { id: existing.id, userId },
        { $set: updates },
        { returnDocument: 'after' }
      );
      account = updated ? cleanDoc<Account>(updated) : { ...existing, ...updates };
    } else {
      // 3. Create new account
      isNew = true;
      action = 'CREATED';
      const newAccId = `ACC-${Math.floor(10000 + Math.random() * 90000)}`;
      const newAccount: Account = {
        id: newAccId,
        userId,
        name,
        email,
        phone,
        country,
        overdueAmount,
        predueAmount,
        externalUserId: externalUserId || undefined,
        metadata: metadata || undefined,
        originalCreditor: creditorName,
        accountNumber: client.accountNumber || `CLI-${Math.floor(100000 + Math.random() * 900000)}`,
        originalBalance: totalBalance > 0 ? totalBalance : overdueAmount,
        currentBalance: overdueAmount > 0 ? overdueAmount : totalBalance,
        daysPastDue: overdueAmount > 0 ? 30 : 0,
        bucket: '30_DPD',
        status: 'ACTIVE',
        riskScore: overdueAmount > 1000 ? 75 : 45,
        maxDiscountPercent: 20,
        notes: [
          {
            id: `n-${Date.now()}`,
            text: `Debtor client ingested via Webhook. Country: ${country}, Overdue: $${overdueAmount.toFixed(2)}, Pre-due: $${predueAmount.toFixed(2)}${externalUserId ? `, User ID: ${externalUserId}` : ''}.`,
            date: new Date().toISOString().split('T')[0],
            author: 'Inbound Webhook',
          },
        ],
      };

      await db.addAccount(newAccount, userId);
      account = newAccount;
    }

    // Auto-queue for collection outreach if overdue > 0
    let queued = false;
    if (overdueAmount > 0) {
      try {
        const existingQueued = await database.collection<QueuedCall>('queued_calls').findOne({
          userId,
          accountId: account.id,
          status: { $in: ['QUEUED', 'DUE', 'IN_PROGRESS'] },
        });

        if (!existingQueued) {
          const queuedCall: QueuedCall = {
            id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId,
            accountId: account.id,
            debtorName: account.name,
            phoneNumber: account.phone,
            originalCreditor: account.originalCreditor,
            currentBalance: account.currentBalance,
            lastAttemptAt: new Date().toISOString(),
            lastDisposition: 'NO_ANSWER',
            attemptCount: 0,
            maxAttempts: settings.maxReattempts || 3,
            nextAttemptAt: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
            status: 'QUEUED',
            createdAt: new Date().toISOString(),
            notes: `Auto-queued via Inbound Webhook (Overdue: $${overdueAmount.toFixed(2)})`,
          };
          await db.upsertQueuedCall(queuedCall, userId);
          queued = true;
        } else {
          // If already queued, update debtor current balance on queued call record
          await database.collection('queued_calls').updateOne(
            { id: existingQueued.id, userId },
            { $set: { currentBalance: account.currentBalance, debtorName: account.name, phoneNumber: account.phone } }
          );
        }
      } catch (err) {
        console.error('Failed to auto-queue call from webhook:', err);
      }
    }

    return {
      account,
      isNew,
      action,
      queued,
      message: `Account ${account.id} ${action.toLowerCase()} successfully.`,
    };
  },
};

// MongoDB Debtor Operations for Voice Agent
export async function getDebtorByAccountNumber(
  accountNumber: string
): Promise<DebtorDocument | null> {
  const database = await connectMongoDb();
  const doc = await database.collection('debtors').findOne({ account_number: accountNumber });
  return (doc as unknown as DebtorDocument) || null;
}

export async function updateDebtorByAccountNumber(
  accountNumber: string,
  updates: Partial<DebtorDocument>
): Promise<DebtorDocument | null> {
  const database = await connectMongoDb();
  const result = await database.collection('debtors').findOneAndUpdate(
    { account_number: accountNumber },
    { $set: { ...updates, updated_at: new Date() } },
    { returnDocument: 'after' }
  );
  return (result as unknown as DebtorDocument) || null;
}

export async function incrementAttemptsToday(
  accountNumber: string
): Promise<DebtorDocument | null> {
  const database = await connectMongoDb();
  const result = await database.collection('debtors').findOneAndUpdate(
    { account_number: accountNumber },
    { $inc: { attempts_today: 1 }, $set: { updated_at: new Date() } },
    { returnDocument: 'after' }
  );
  return (result as unknown as DebtorDocument) || null;
}

export async function resetAttemptsToday(
  accountNumber: string
): Promise<DebtorDocument | null> {
  const database = await connectMongoDb();
  const result = await database.collection('debtors').findOneAndUpdate(
    { account_number: accountNumber },
    { $set: { attempts_today: 0, updated_at: new Date() } },
    { returnDocument: 'after' }
  );
  return (result as unknown as DebtorDocument) || null;
}

export async function pushInteractionHistory(
  accountNumber: string,
  interaction: {
    timestamp: Date;
    type: string;
    outcome_type: string;
    outcome_payload?: Record<string, any>;
    duration_seconds?: number;
    notes?: string;
    agent_id?: string;
  }
): Promise<DebtorDocument | null> {
  const database = await connectMongoDb();
  const result = await database.collection('debtors').findOneAndUpdate(
    { account_number: accountNumber },
    {
      $push: { interaction_history: interaction as any },
      $set: { updated_at: new Date() },
    },
    { returnDocument: 'after' }
  );
  return (result as unknown as DebtorDocument) || null;
}