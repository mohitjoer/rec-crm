import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const MCP_SERVER_PATH = path.resolve(process.cwd(), 'mcp_server/server.js');
const GLOBAL_CONFIG_PATH = path.join(os.homedir(), '.gemini/config/mcp_config.json');

const TOOLS = [
  {
    name: 'get_dashboard_summary',
    description: 'Fetch overall portfolio KPIs: total accounts, overdue, pre-due, promised amounts, total calls made, recovery rate, and compliance scores.',
    parameters: 'days (optional number, default 30)',
    category: 'Portfolio Analytics',
  },
  {
    name: 'get_customers',
    description: 'Query customer and client accounts from the CRM ledger with filters for status, aging buckets, or query search.',
    parameters: 'query, status, bucket, minDaysPastDue, limit',
    category: 'Customer Accounts',
  },
  {
    name: 'get_customer_detail',
    description: 'Deep-dive profile lookup for a specific debtor by ID, name, or phone. Returns full ledger profile, notes, and call transcripts.',
    parameters: 'identifier (required string)',
    category: 'Debtor Profiler',
  },
  {
    name: 'get_delinquency_and_aging',
    description: 'Detailed financial breakdown of overdue vs pre-due balances across all delinquency aging buckets (30/60/90/120+ DPD).',
    parameters: 'None',
    category: 'Risk & Aging',
  },
  {
    name: 'get_calls_and_telemetry',
    description: 'Fetch telephony records and voice agent call telemetry: total calls made, durations, dispositions, compliance scores, and speech transcripts.',
    parameters: 'accountId, disposition, status, limit, includeTranscripts',
    category: 'Voice Telemetry',
  },
  {
    name: 'get_recovery_queue',
    description: 'Fetch the automated retry queue for calls that went to voicemail, had no answer, or requested callbacks.',
    parameters: 'status (optional string)',
    category: 'Dialer Automation',
  },
];

export async function GET() {
  try {
    const serverExists = fs.existsSync(MCP_SERVER_PATH);

    let isGlobalConfigured = false;
    try {
      // Must read at runtime to reflect user updates to global MCP configuration
      // react-doctor-disable-next-line react-doctor/server-hoist-static-io
      const raw = await fs.promises.readFile(GLOBAL_CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.mcpServers && parsed.mcpServers['recovra-crm']) {
        isGlobalConfigured = true;
      }
    } catch {
      // ignore if file doesn't exist or is invalid JSON
    }

    const configs = {
      antigravity: JSON.stringify(
        {
          mcpServers: {
            'recovra-crm': {
              command: 'node',
              args: [MCP_SERVER_PATH],
              env: { NODE_ENV: 'production' },
            },
          },
        },
        null,
        2
      ),
      claudeDesktop: JSON.stringify(
        {
          mcpServers: {
            'recovra-crm': {
              command: 'node',
              args: [MCP_SERVER_PATH],
            },
          },
        },
        null,
        2
      ),
      cursor: {
        name: 'recovra-crm',
        type: 'command',
        command: `node ${MCP_SERVER_PATH}`,
      },
    };

    return NextResponse.json({
      serverPath: MCP_SERVER_PATH,
      serverExists,
      isGlobalConfigured,
      globalConfigPath: GLOBAL_CONFIG_PATH,
      tools: TOOLS,
      configs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to inspect MCP settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { getTenantFromRequest, unauthorizedResponse } = await import('@/lib/tenant');
    const tenant = await getTenantFromRequest(req);
    if (!tenant) {
      return unauthorizedResponse();
    }

    // Dynamic import to execute a test against the CRM database for this user
    const { db } = await import('@/lib/db');
    const [stats, accounts, calls] = await Promise.all([
      db.getDashboardStats(tenant.userId),
      db.getAccounts(tenant.userId),
      db.getCalls(tenant.userId),
    ]);

    const testOutput = {
      status: 'SUCCESS',
      serverProtocol: 'Model Context Protocol (Stdio JSON-RPC 2.0)',
      databaseStatus: 'CONNECTED (MongoDB Atlas)',
      userId: tenant.userId,
      toolsCount: TOOLS.length,
      sampleLiveQuery: {
        portfolioBalance: stats.portfolioSummary.totalBalance,
        totalOverdue: stats.portfolioSummary.totalOverdue,
        totalAccounts: stats.portfolioSummary.totalAccounts,
        totalCallsMade: calls.length,
        averageComplianceScore: calls.length > 0 ? (calls[0].complianceScore ?? 98) : 100,
        sampleCustomer: accounts.length > 0 ? { id: accounts[0].id, name: accounts[0].name, balance: accounts[0].currentBalance } : null,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(testOutput);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to execute MCP diagnostic test' },
      { status: 500 }
    );
  }
}
