#!/usr/bin/env node

/**
 * Recovra CRM MCP Server
 * Exposes Model Context Protocol (MCP) tools for AI agents to query customer/client accounts,
 * overdue vs pre-due balances, delinquency aging buckets, voice call telemetry, and dashboard metrics.
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from crm/.env.local if present
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config();

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { MongoClient } = require('mongodb');

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://Vercel-Admin-atlas-citron-school:cNphrvKaTdiDGY1B@atlas-citron-school.9qebpci.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = 'collection_crm';

let mongoClient = null;

async function getDb() {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
  }
  return mongoClient.db(DB_NAME);
}

function cleanDoc(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
}

// Helper: Calculate dashboard and portfolio metrics
async function calculateDashboardOverview(days = 30, userId = null) {
  const db = await getDb();
  const query = userId ? { userId } : {};
  const [accounts, calls, queuedCalls] = await Promise.all([
    db.collection('accounts').find(query).toArray(),
    db.collection('calls').find(query).sort({ startTime: -1 }).toArray(),
    db.collection('queued_calls').find(query).toArray(),
  ]);

  const totalAccounts = accounts.length;
  const totalBalance = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const totalOriginalBalance = accounts.reduce((sum, a) => sum + (a.originalBalance || 0), 0);

  // Overdue (30+ DPD and not settled) vs Pre-due (<30 DPD and not settled)
  const overdueAccounts = accounts.filter(
    (a) => (a.daysPastDue || 0) >= 30 && a.status !== 'SETTLED'
  );
  const totalOverdue = overdueAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const preDueAccounts = accounts.filter(
    (a) => (a.daysPastDue || 0) < 30 && a.status !== 'SETTLED'
  );
  const totalPreDue = preDueAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const settledAccounts = accounts.filter((a) => a.status === 'SETTLED');
  const settledCount = settledAccounts.length;

  const ptpAccounts = accounts.filter((a) => a.status === 'PROMISE_TO_PAY' && a.promiseToPay);
  const ptpCount = ptpAccounts.length;
  const promisedAmount = ptpAccounts.reduce(
    (sum, a) => sum + (a.promiseToPay?.amount || 0),
    0
  );

  // Call stats
  const totalCalls = calls.length;
  const completedCalls = calls.filter((c) => c.status === 'COMPLETED').length;
  const durations = calls
    .map((c) => c.durationSeconds)
    .filter((d) => typeof d === 'number' && !isNaN(d));
  const avgDurationSeconds =
    durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  const complianceScores = calls
    .map((c) => c.complianceScore)
    .filter((s) => typeof s === 'number' && !isNaN(s));
  const avgComplianceScore =
    complianceScores.length > 0
      ? Number((complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length).toFixed(1))
      : 100.0;

  const miniMirandaPassedCount = calls.filter((c) => c.miniMirandaPassed).length;
  const miniMirandaPassRate =
    totalCalls > 0 ? Math.round((miniMirandaPassedCount / totalCalls) * 100) : 100;

  // Recovery Rate
  const totalRecovered = accounts.reduce(
    (sum, a) => sum + Math.max(0, (a.originalBalance || 0) - (a.currentBalance || 0)),
    0
  );
  const recoveryRate =
    totalOriginalBalance > 0
      ? Number(((totalRecovered / totalOriginalBalance) * 100).toFixed(1))
      : 0;

  // Aging delinquency buckets
  const bucketKeys = ['30_DPD', '60_DPD', '90_DPD', '120_PLUS_DPD'];
  const bucketLabels = {
    '30_DPD': '30 DPD (Early Delinquency)',
    '60_DPD': '60 DPD (Mid-Stage)',
    '90_DPD': '90 DPD (Late-Stage)',
    '120_PLUS_DPD': '120+ DPD (Pre-Chargeoff)',
  };

  const delinquencyBuckets = bucketKeys.map((bucketId) => {
    const inBucket = accounts.filter((a) => a.bucket === bucketId);
    const amount = inBucket.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    return {
      bucket: bucketId,
      label: bucketLabels[bucketId],
      count: inBucket.length,
      amount,
      percentageOfPortfolio: totalBalance > 0 ? Number(((amount / totalBalance) * 100).toFixed(1)) : 0,
    };
  });

  // Call dispositions breakdown
  const dispositionBreakdown = {};
  calls.forEach((c) => {
    const disp = c.disposition || 'UNKNOWN';
    dispositionBreakdown[disp] = (dispositionBreakdown[disp] || 0) + 1;
  });

  // Recent interaction trend
  const now = new Date();
  const dailyMap = new Map();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    dailyMap.set(dateStr, 0);
  }

  for (const call of calls) {
    if (call.startTime) {
      const dateStr = call.startTime.slice(0, 10);
      if (dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, dailyMap.get(dateStr) + 1);
      }
    }
  }

  const dailyTrend = Array.from(dailyMap.entries()).map(([date, count]) => ({
    date,
    callsMade: count,
  }));

  return {
    portfolioSummary: {
      totalAccounts,
      activeAccounts: totalAccounts - settledCount,
      settledAccounts: settledCount,
      totalBalance,
      totalOverdue,
      totalPreDue,
      promisedAmount,
      ptpAccountsCount: ptpCount,
      totalRecoveredToDate: totalRecovered,
      recoveryRatePercent: recoveryRate,
      queuedRetryCallsCount: queuedCalls.length,
    },
    telemetrySummary: {
      totalCallsMade: totalCalls,
      completedCalls,
      avgCallDurationSeconds: avgDurationSeconds,
      avgCallDurationFormatted: `${Math.floor(avgDurationSeconds / 60)}m ${avgDurationSeconds % 60}s`,
      avgComplianceScore,
      miniMirandaPassRatePercent: miniMirandaPassRate,
      dispositionBreakdown,
    },
    delinquencyBuckets,
    interactionTrends: {
      periodDays: days,
      dailyTrend,
    },
  };
}

// Initialize MCP Server
const server = new Server(
  {
    name: 'recovra-crm-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tool schemas
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_dashboard_summary',
        description:
          'Fetch overall portfolio KPIs and metrics from the CRM dashboard: total accounts, total balance, total overdue (>=30 DPD), total pre-due (<30 DPD), promised amounts (PTP), total calls made, recovery rate, compliance score, and delinquency bucket totals. Use this to explain the overall health of the collection portfolio.',
        inputSchema: {
          type: 'object',
          properties: {
            days: {
              type: 'number',
              description: 'Number of days to include in the daily call interaction trend (default 30).',
            },
          },
        },
      },
      {
        name: 'get_customers',
        description:
          'Query customer and client accounts from the CRM ledger. Supports filtering by search query (name, phone, email, account ID), status (ACTIVE, PROMISE_TO_PAY, SETTLED), aging bucket (30_DPD, 60_DPD, etc.), or minimum days past due.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search string matching customer name, email, phone number, or account ID.',
            },
            status: {
              type: 'string',
              description: 'Filter by account status (e.g. ACTIVE, PROMISE_TO_PAY, SETTLED).',
            },
            bucket: {
              type: 'string',
              description: 'Filter by delinquency bucket (e.g. 30_DPD, 60_DPD, 90_DPD, 120_PLUS_DPD).',
            },
            minDaysPastDue: {
              type: 'number',
              description: 'Filter accounts with daysPastDue greater than or equal to this number.',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of accounts to return (default 50).',
            },
          },
        },
      },
      {
        name: 'get_customer_detail',
        description:
          'Fetch deep details for a specific customer or client by Account ID (e.g. ACC-54366), customer name (e.g. mohit), or phone number. Returns full debtor profile, current balance, past-due status, payment promises, internal notes, and all voice call recordings and transcripts.',
        inputSchema: {
          type: 'object',
          required: ['identifier'],
          properties: {
            identifier: {
              type: 'string',
              description: 'Account ID (e.g. ACC-54366), customer name, or phone number to look up.',
            },
          },
        },
      },
      {
        name: 'get_delinquency_and_aging',
        description:
          'Fetch a detailed financial breakdown of overdue vs pre-due balances across all delinquency aging buckets (Current/Pre-due, 30 DPD, 60 DPD, 90 DPD, 120+ DPD). Explains risk exposure and cash distribution.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_calls_and_telemetry',
        description:
          'Fetch telephony records and voice agent call telemetry: total calls made, call durations, dispositions (e.g. CALL_BACK, PROMISE_TO_PAY, NO_ANSWER, VOICEMAIL), compliance scores, and verbatim call transcripts.',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: {
              type: 'string',
              description: 'Filter calls by a specific debtor account ID.',
            },
            disposition: {
              type: 'string',
              description: 'Filter calls by disposition (e.g. CALL_BACK, PROMISE_TO_PAY, SETTLED, NO_ANSWER, VOICEMAIL).',
            },
            status: {
              type: 'string',
              description: 'Filter calls by status (e.g. COMPLETED, FAILED, IN_PROGRESS).',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of call records to return (default 20).',
            },
            includeTranscripts: {
              type: 'boolean',
              description: 'Whether to include full verbatim speech transcripts for each call (default true).',
            },
          },
        },
      },
      {
        name: 'get_recovery_queue',
        description:
          'Fetch the automated retry queue for calls that went to voicemail, had no answer, or requested callbacks. Shows pending attempt counts, next scheduled dial times, and queue reattempt interval settings.',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Filter by queue status (e.g. QUEUED, DUE, EXHAUSTED, COMPLETED).',
            },
          },
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  const db = await getDb();

  try {
    switch (name) {
      case 'get_dashboard_summary': {
        const days = typeof args.days === 'number' ? args.days : 30;
        const userId = args.userId || process.env.RECOVRA_USER_ID || null;
        const data = await calculateDashboardOverview(days, userId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'get_customers': {
        const userId = args.userId || process.env.RECOVRA_USER_ID || null;
        const filter = {};
        if (userId) {
          filter.userId = userId;
        }

        if (args.status) {
          filter.status = args.status;
        }
        if (args.bucket) {
          filter.bucket = args.bucket;
        }
        if (typeof args.minDaysPastDue === 'number') {
          filter.daysPastDue = { $gte: args.minDaysPastDue };
        }
        if (args.query && typeof args.query === 'string') {
          const regex = new RegExp(args.query.trim(), 'i');
          filter.$or = [
            { id: regex },
            { name: regex },
            { phone: regex },
            { email: regex },
            { originalCreditor: regex },
          ];
        }

        const limit = typeof args.limit === 'number' ? Math.min(args.limit, 100) : 50;
        const docs = await db.collection('accounts').find(filter).limit(limit).toArray();
        const accounts = docs.map(cleanDoc);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  count: accounts.length,
                  accounts,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_customer_detail': {
        const userId = args.userId || process.env.RECOVRA_USER_ID || null;
        const identifier = (args.identifier || '').trim();
        if (!identifier) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: 'Missing required parameter "identifier".' }),
              },
            ],
            isError: true,
          };
        }

        const regex = new RegExp(`^${identifier}$`, 'i');
        const partialRegex = new RegExp(identifier, 'i');

        const accountQuery = {
          $or: [
            { id: regex },
            { name: regex },
            { phone: regex },
            { email: regex },
            { id: partialRegex },
            { name: partialRegex },
          ],
        };
        if (userId) {
          accountQuery.userId = userId;
        }

        // Search account by ID, exact name, or partial name/phone scoped to user
        const account = await db.collection('accounts').findOne(accountQuery);

        if (!account) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  found: false,
                  message: `No customer account found matching identifier "${identifier}".`,
                }),
              },
            ],
          };
        }

        const cleanedAccount = cleanDoc(account);

        // Fetch associated calls
        const callsQuery = {
          $or: [{ accountId: cleanedAccount.id }, { debtorName: cleanedAccount.name }],
        };
        if (userId) {
          callsQuery.userId = userId;
        }

        const calls = await db
          .collection('calls')
          .find(callsQuery)
          .sort({ startTime: -1 })
          .toArray();

        // Fetch associated queued calls if any
        const queuedQuery = { accountId: cleanedAccount.id };
        if (userId) {
          queuedQuery.userId = userId;
        }
        const queuedCall = await db.collection('queued_calls').findOne(queuedQuery);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  found: true,
                  account: cleanedAccount,
                  totalCallsMade: calls.length,
                  calls: calls.map(cleanDoc),
                  queuedRetryStatus: queuedCall ? cleanDoc(queuedCall) : null,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_delinquency_and_aging': {
        const userId = args.userId || process.env.RECOVRA_USER_ID || null;
        const accounts = await db
          .collection('accounts')
          .find(userId ? { userId } : {})
          .toArray();

        const totalBalance = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

        // Pre-due / current (< 30 days) vs Overdue (>= 30 days)
        const preDue = accounts.filter((a) => (a.daysPastDue || 0) < 30 && a.status !== 'SETTLED');
        const overdue = accounts.filter((a) => (a.daysPastDue || 0) >= 30 && a.status !== 'SETTLED');

        const preDueTotal = preDue.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
        const overdueTotal = overdue.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

        const bucketConfig = [
          { id: 'CURRENT', label: 'Pre-due / Current (<30 DPD)', min: 0, max: 29 },
          { id: '30_DPD', label: '30 DPD (Early Delinquency)', min: 30, max: 59 },
          { id: '60_DPD', label: '60 DPD (Mid-Stage Delinquency)', min: 60, max: 89 },
          { id: '90_DPD', label: '90 DPD (Late-Stage Delinquency)', min: 90, max: 119 },
          { id: '120_PLUS_DPD', label: '120+ DPD (Pre-Chargeoff)', min: 120, max: Infinity },
        ];

        const buckets = bucketConfig.map((cfg) => {
          const matches = accounts.filter((a) => {
            const dpd = a.daysPastDue || 0;
            return dpd >= cfg.min && dpd <= cfg.max && a.status !== 'SETTLED';
          });
          const amount = matches.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
          return {
            bucketId: cfg.id,
            label: cfg.label,
            accountCount: matches.length,
            totalBalance: amount,
            percentageOfPortfolio: totalBalance > 0 ? Number(((amount / totalBalance) * 100).toFixed(1)) : 0,
            accounts: matches.map((a) => ({
              id: a.id,
              name: a.name,
              balance: a.currentBalance,
              daysPastDue: a.daysPastDue,
              status: a.status,
            })),
          };
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  portfolioBalance: totalBalance,
                  overdueSummary: {
                    totalOverdueAmount: overdueTotal,
                    overdueAccountsCount: overdue.length,
                    totalPreDueAmount: preDueTotal,
                    preDueAccountsCount: preDue.length,
                  },
                  agingBuckets: buckets,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_calls_and_telemetry': {
        const userId = args.userId || process.env.RECOVRA_USER_ID || null;
        const filter = {};
        if (userId) {
          filter.userId = userId;
        }
        if (args.accountId) {
          filter.accountId = args.accountId;
        }
        if (args.disposition) {
          filter.disposition = args.disposition;
        }
        if (args.status) {
          filter.status = args.status;
        }

        const limit = typeof args.limit === 'number' ? Math.min(args.limit, 100) : 20;
        const includeTranscripts = args.includeTranscripts !== false;

        const calls = await db
          .collection('calls')
          .find(filter)
          .sort({ startTime: -1 })
          .limit(limit)
          .toArray();

        const cleanedCalls = calls.map((c) => {
          const doc = cleanDoc(c);
          if (!includeTranscripts) {
            delete doc.transcript;
          }
          return doc;
        });

        // Summary counts
        const allCalls = await db
          .collection('calls')
          .find(userId ? { userId } : {})
          .toArray();
        const dispositionCounts = {};
        allCalls.forEach((c) => {
          const disp = c.disposition || 'UNKNOWN';
          dispositionCounts[disp] = (dispositionCounts[disp] || 0) + 1;
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  totalCallsInDatabase: allCalls.length,
                  returnedCallsCount: cleanedCalls.length,
                  dispositionBreakdown: dispositionCounts,
                  calls: cleanedCalls,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_recovery_queue': {
        const userId = args.userId || process.env.RECOVRA_USER_ID || null;
        const filter = {};
        if (userId) {
          filter.userId = userId;
        }
        if (args.status) {
          filter.status = args.status;
        }

        const [queuedCalls, settings] = await Promise.all([
          db.collection('queued_calls').find(filter).sort({ nextAttemptAt: 1 }).toArray(),
          db.collection('settings').findOne({ id: userId ? `user_${userId}` : 'global' }),
        ]);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  totalQueuedCalls: queuedCalls.length,
                  queueSettings: settings ? cleanDoc(settings) : null,
                  queuedCalls: queuedCalls.map(cleanDoc),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool name: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message || String(error) }),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('Fatal error starting Recovra CRM MCP Server:', err);
  process.exit(1);
});
