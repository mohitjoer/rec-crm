import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantFromRequest } from '@/lib/tenant';

interface SimulateRequest {
  accountId: string;
  debtorName: string;
  creditor: string;
  balance: number;
  userMessage: string;
  history: Array<{ speaker: string; text: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(req);
    const { accountId, debtorName, creditor, balance, userMessage, history }: SimulateRequest = await req.json();

    let resolvedDebtorName = debtorName;
    let resolvedCreditor = creditor;
    let resolvedBalance = balance ?? 0;

    if (accountId && (!resolvedDebtorName || !resolvedCreditor)) {
      const acc = await db.getAccountById(accountId, tenant?.userId);
      if (acc) {
        resolvedDebtorName = resolvedDebtorName || acc.name;
        resolvedCreditor = resolvedCreditor || acc.originalCreditor;
        resolvedBalance = resolvedBalance || acc.currentBalance;
      }
    }

    const lower = (userMessage || '').toLowerCase();
    let agentResponse = '';
    let actionTriggered: string | null = null;
    let actionData: any = null;
    let sentiment: 'positive' | 'neutral' | 'defensive' | 'anxious' | 'angry' = 'neutral';

    const settings = await db.getQueueSettings(tenant?.userId);
    const companyName = settings.companyName || settings.brandName || 'Recovra';

    // Conversational state heuristics adhering to collection rules & mini-miranda
    if (!history || history.length === 0) {
      agentResponse = `Hello ${resolvedDebtorName || 'there'}, this is Sarah calling from ${companyName} regarding your ${resolvedCreditor || 'account'}. How are you doing today?`;
    } else if (lower.includes('why') || lower.includes('who is this') || lower.includes('what is this regarding')) {
      agentResponse = `Please note this is an attempt to collect a debt and any information obtained will be used for that purpose. We are calling regarding your past-due balance of $${balance.toLocaleString()} with ${creditor}. We're reaching out to help find a manageable solution to bring this current.`;
      sentiment = 'neutral';
    } else if (lower.includes('discount') || lower.includes('settle') || lower.includes('lump sum') || lower.includes('how much off')) {
      agentResponse = `We do not offer any discounts or balance reductions. I will send you an email with all the details, and you can connect with the team to clear your doubts.`;
      sentiment = 'neutral';
    } else if (lower.includes('next week') || lower.includes('friday') || lower.includes('pay') || lower.includes('can pay') || lower.includes('payday')) {
      // Determine amount
      const numMatch = lower.match(/\$?(\d+)/);
      const amount = numMatch ? Number(numMatch[1]) : Math.min(balance, 350);
      agentResponse = `Thank you for working with me on this, ${debtorName}. I've scheduled a Promise to Pay for $${amount.toFixed(2)} on your next payday. You'll receive a confirmation SMS with the payment link. Does that sound good?`;
      actionTriggered = 'PROMISE_TO_PAY';
      actionData = { amount, date: 'Next Payday (Scheduled)', method: 'Debit Card / Portal' };
      sentiment = 'positive';
    } else if (lower.includes('lost my job') || lower.includes('unemployed') || lower.includes('hospital') || lower.includes('medical') || lower.includes('hardship') || lower.includes('cant afford') || lower.includes("can't pay")) {
      agentResponse = `I am truly sorry to hear you're going through this hardship. I want to make sure you're supported. I can place a temporary 30-day hardship hold on your account while our specialist team reviews income-based reduction options. Would you like me to flag this for hardship review?`;
      actionTriggered = 'HARDSHIP_HOLD';
      actionData = { category: 'HARDSHIP_FINANCIAL', notes: userMessage };
      sentiment = 'anxious';
    } else if (lower.includes('not mine') || lower.includes('fraud') || lower.includes('wrong number') || lower.includes('dispute')) {
      agentResponse = `Understood. I will immediately flag this account as disputed and place a pause on collection outreach while our compliance team verifies original account documentation with ${creditor}.`;
      actionTriggered = 'DISPUTE_RAISED';
      actionData = { category: 'DISPUTE_AMOUNT', notes: userMessage };
      sentiment = 'defensive';
    } else if (lower.includes('installment') || lower.includes('monthly') || lower.includes('plan')) {
      agentResponse = `We do not offer monthly installment plans. I will send you an email with all the details, and you can connect with the team to clear your doubts.`;
      sentiment = 'neutral';
    } else if (lower.includes('yes') || lower.includes('sounds good') || lower.includes('agree') || lower.includes('ok') || lower.includes('sure')) {
      agentResponse = `Wonderful! Everything is locked in and confirmed in our system. You will receive an immediate confirmation email and text. Thank you for your time today ${debtorName}, and have a great rest of your day!`;
      sentiment = 'positive';
    } else if (lower.includes('stop calling') || lower.includes('f***') || lower.includes('angry') || lower.includes('sue') || lower.includes('lawyer')) {
      agentResponse = `I understand your frustration. I am noting your preference on the account and will ensure our communication adheres strictly to your request. Have a good day.`;
      sentiment = 'angry';
    } else {
      agentResponse = `Sorry, I can't help you with that, but I will send you an email with all the details and you can connect with the team to clear your doubts.`;
      sentiment = 'neutral';
    }

    return NextResponse.json({
      agentResponse,
      sentiment,
      actionTriggered,
      actionData
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
