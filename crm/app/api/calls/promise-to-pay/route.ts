import { NextRequest, NextResponse } from 'next/server';
import { db, getDebtorByAccountNumber, updateDebtorByAccountNumber } from '@/lib/db';
import { Note } from '@/lib/types';
import { isAgentOrSessionAuthorized } from '@/lib/agent-auth';

export async function POST(req: NextRequest) {
  try {
    if (!(await isAgentOrSessionAuthorized(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId, amount, date, method } = await req.json();

    if (!accountId || !amount || !date) {
      return NextResponse.json({ error: 'Missing required PTP parameters' }, { status: 400 });
    }

    let updatedAccount: any = null;

    try {
      const debtor = await getDebtorByAccountNumber(accountId);
      if (debtor) {
        updatedAccount = await updateDebtorByAccountNumber(accountId, {
          status: 'PROMISE_TO_PAY',
          sequence_stage: 'reminder_4',
          promised_date: date,
          promise_to_pay: {
            amount,
            date,
            method,
            status: 'PENDING',
          },
          last_contacted: new Date(),
        });
      }
    } catch {
      // Ignore and fallback to accounts collection
    }

    if (!updatedAccount) {
      const existingAccount = await db.getAccountById(accountId);
      if (existingAccount) {
        const newNote: Note = {
          id: `n-${Date.now()}`,
          text: `Promise to Pay scheduled: $${amount.toFixed(2)} on ${date} via ${method}`,
          date: new Date().toISOString().split('T')[0],
          author: 'AI Voice Agent',
        };

        const updated = await db.updateAccount(accountId, {
          status: 'PROMISE_TO_PAY',
          nextActionDate: date,
          promiseToPay: {
            amount,
            date,
            method,
            status: 'PENDING',
          },
          notes: [newNote, ...(existingAccount.notes || [])],
        }, existingAccount.userId);
        updatedAccount = updated;
      }
    }

    if (!updatedAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `PTP logged for ${accountId}: $${amount} on ${date}`,
      account: updatedAccount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
