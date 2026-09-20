import nodemailer from 'nodemailer';
import { Account, CallRecord } from '@/lib/types';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SmtpConfigStatus {
  isConfigured: boolean;
  host: string;
  port: number;
  user: string;
  from: string;
}

export function getSmtpConfig(): SmtpConfigStatus {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || '';
  const from = process.env.SMTP_FROM || user || 'Recovra <recovraai@gmail.com>';
  const pass = process.env.SMTP_PASS || '';

  return {
    isConfigured: Boolean(user && pass),
    host,
    port,
    user,
    from,
  };
}

export function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || '';
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!user || !pass) {
    throw new Error('SMTP credentials are not configured in environment variables.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export async function verifySmtpConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to authenticate with SMTP server.',
    };
  }
}

export async function sendEmail(options: EmailOptions) {
  const transporter = createTransporter();
  const config = getSmtpConfig();

  const info = await transporter.sendMail({
    from: options.from || config.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  return info;
}

export async function sendTestEmail(recipientEmail: string) {
  const config = getSmtpConfig();
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: #09090b; padding: 24px 32px; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { margin: 4px 0 0 0; font-size: 12px; color: #a1a1aa; }
          .content { padding: 32px; }
          .badge { display: inline-block; padding: 4px 10px; background: #ecfdf5; color: #059669; font-weight: 600; font-size: 11px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #a7f3d0; }
          .info-box { background: #f4f4f5; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 12px; font-family: monospace; }
          .info-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .info-label { color: #71717a; }
          .info-val { font-weight: 600; color: #09090b; }
          .footer { padding: 20px 32px; background: #fafafa; border-top: 1px solid #e4e4e7; font-size: 11px; color: #71717a; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Recovra Mail Outreach</h1>
            <p>Collections that run themselves</p>
          </div>
          <div class="content">
            <span class="badge">● SMTP Test Dispatch Verified</span>
            <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #09090b;">SMTP Configuration Verified Successfully</h2>
            <p style="font-size: 13px; line-height: 1.6; color: #52525b; margin: 0 0 16px 0;">
              This email confirms that your SMTP mail outreach engine has been successfully configured and authenticated on <strong>${config.host}</strong>.
            </p>
            <div class="info-box">
              <div class="info-row"><span class="info-label">Sender Account:</span> <span class="info-val">${config.user}</span></div>
              <div class="info-row"><span class="info-label">SMTP Host:</span> <span class="info-val">${config.host}:${config.port}</span></div>
              <div class="info-row"><span class="info-label">Timestamp:</span> <span class="info-val">${timestamp} IST</span></div>
              <div class="info-row"><span class="info-label">Target Recipient:</span> <span class="info-val">${recipientEmail}</span></div>
            </div>
            <p style="font-size: 12px; color: #71717a; margin: 0;">
              Your autonomous collection recovery workflow is now equipped to dispatch payment reminders, settlement formal notices, and promise-to-pay receipts.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Recovra Inc. • Enterprise Debt Recovery Platform
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: 'Recovra — SMTP Mail Connection Verification',
    html,
    text: `Recovra SMTP Mail Verification\n\nYour SMTP mail server (${config.host}:${config.port}) using ${config.user} has been verified successfully at ${timestamp}.`,
  });
}

export interface PostCallEmailPayload {
  account: Account;
  call: CallRecord;
  companyName: string;
}

export async function sendPostCallDebtorEmail({
  account,
  call,
  companyName,
}: PostCallEmailPayload) {
  if (!account.email) {
    return null;
  }

  const creditor = account.originalCreditor || 'Creditor';
  const balanceStr = `$${account.currentBalance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  let subject = `Account Resolution Summary — ${creditor} (Ref: ${account.accountNumber || account.id})`;
  let headerTitle = 'Account Resolution Summary';
  let badgeText = 'Call Complete';
  let badgeBg = '#f4f4f5';
  let badgeColor = '#52525b';
  let badgeBorder = '#e4e4e7';
  let outcomeHtml = '';

  if (call.disposition === 'PROMISE_TO_PAY' && call.amountPromised) {
    subject = `Payment Arrangement Confirmation — ${creditor} (Ref: ${account.accountNumber || account.id})`;
    headerTitle = 'Payment Promise Confirmed';
    badgeText = 'Promise to Pay Logged';
    badgeBg = '#ecfdf5';
    badgeColor = '#059669';
    badgeBorder = '#a7f3d0';
    outcomeHtml = `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <div style="font-size: 11px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Agreed Payment Arrangement</div>
        <div style="font-size: 13px; color: #166534; line-height: 1.5;">
          Thank you for speaking with our representative. As agreed during our phone conversation today, we have recorded your scheduled payment:
        </div>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #bbf7d0; display: flex; justify-content: space-between;">
          <div><strong style="color: #14532d; font-size: 14px;">Amount: $${Number(call.amountPromised).toFixed(2)}</strong></div>
          <div><span style="color: #15803d; font-size: 13px;">Scheduled Date: <strong>${call.promisedDate || 'Per verbal agreement'}</strong></span></div>
        </div>
      </div>
    `;
  } else if (call.disposition === 'SETTLEMENT_OFFERED') {
    subject = `Authorized Settlement Terms — ${creditor} (Ref: ${account.accountNumber || account.id})`;
    headerTitle = 'Settlement Terms Authorized';
    badgeText = 'Settlement Offer';
    badgeBg = '#eff6ff';
    badgeColor = '#2563eb';
    badgeBorder = '#bfdbfe';
    outcomeHtml = `
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <div style="font-size: 11px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Settlement Opportunity</div>
        <div style="font-size: 13px; color: #1e40af; line-height: 1.5;">
          During our call, you were presented with authorized one-time payoff terms to satisfy this account at a substantial reduction. Please contact our resolution team promptly to execute this payoff before authorization closes.
        </div>
      </div>
    `;
  } else if (call.disposition === 'PAYMENT_PLAN') {
    subject = `Installment Plan Arrangement — ${creditor} (Ref: ${account.accountNumber || account.id})`;
    headerTitle = 'Installment Plan Summary';
    badgeText = 'Payment Plan Arranged';
    badgeBg = '#f5f3ff';
    badgeColor = '#7c3aed';
    badgeBorder = '#ddd6fe';
    outcomeHtml = `
      <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <div style="font-size: 11px; font-weight: 700; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Structured Installment Plan</div>
        <div style="font-size: 13px; color: #5b21b6; line-height: 1.5;">
          Your recurring installment arrangement has been registered to bring this obligation current in affordable scheduled increments.
        </div>
      </div>
    `;
  } else if (call.disposition === 'DISPUTE_RAISED') {
    subject = `Account Dispute Notice Logged — ${creditor} (Ref: ${account.accountNumber || account.id})`;
    headerTitle = 'Inquiry & Dispute Logged';
    badgeText = 'Pending Review';
    badgeBg = '#fffbeb';
    badgeColor = '#b45309';
    badgeBorder = '#fde68a';
    outcomeHtml = `
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <div style="font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Notice of Dispute Registered</div>
        <div style="font-size: 13px; color: #78350f; line-height: 1.5;">
          We have formally documented your dispute or financial hardship note. Collection activity will respect required review periods while account verification is reviewed.
        </div>
      </div>
    `;
  } else {
    outcomeHtml = `
      <div style="background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <div style="font-size: 13px; color: #3f3f46; line-height: 1.5;">
          Thank you for taking the time to speak with our account resolution team today regarding your account. Please feel free to reach out with any questions.
        </div>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
          .header { background: #09090b; padding: 26px 32px; color: #ffffff; }
          .header h1 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
          .header p { margin: 4px 0 0 0; font-size: 12px; color: #a1a1aa; }
          .content { padding: 32px; }
          .badge { display: inline-block; padding: 4px 10px; font-weight: 600; font-size: 11px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid ${badgeBorder}; background: ${badgeBg}; color: ${badgeColor}; }
          .meta-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; }
          .meta-table td { padding: 10px 16px; font-size: 12px; border-bottom: 1px solid #f4f4f5; }
          .meta-table tr:last-child td { border-bottom: none; }
          .meta-label { color: #71717a; width: 40%; }
          .meta-value { color: #09090b; font-weight: 600; font-family: monospace; }
          .disclaimer { font-size: 11px; line-height: 1.5; color: #71717a; background: #f4f4f5; padding: 14px 18px; border-radius: 10px; margin-top: 24px; border-left: 3px solid #71717a; }
          .footer { padding: 20px 32px; background: #fafafa; border-top: 1px solid #e4e4e7; font-size: 11px; color: #a1a1aa; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${companyName}</h1>
            <p>Account Resolution &amp; Recovery Administration</p>
          </div>
          <div class="content">
            <span class="badge">● ${badgeText}</span>
            <h2 style="margin: 0 0 8px 0; font-size: 16px; color: #09090b;">${headerTitle}</h2>
            <p style="font-size: 13px; line-height: 1.6; color: #52525b; margin: 0 0 16px 0;">
              Dear ${account.name},
            </p>
            <p style="font-size: 13px; line-height: 1.6; color: #52525b; margin: 0 0 16px 0;">
              This notice provides formal confirmation of your recent telephone discussion regarding your account with <strong>${creditor}</strong> on ${dateFormatted}.
            </p>

            ${outcomeHtml}

            <table class="meta-table">
              <tr>
                <td class="meta-label">Original Creditor:</td>
                <td class="meta-value">${creditor}</td>
              </tr>
              <tr>
                <td class="meta-label">Account Reference:</td>
                <td class="meta-value">${account.accountNumber || account.id}</td>
              </tr>
              <tr>
                <td class="meta-label">Current Outstanding:</td>
                <td class="meta-value">${balanceStr}</td>
              </tr>
              <tr>
                <td class="meta-label">Days Delinquent:</td>
                <td class="meta-value">${account.daysPastDue} days</td>
              </tr>
            </table>

            <div class="disclaimer">
              <strong>FDCPA Statutory Notice:</strong> This is a communication from a debt collector. This is an attempt to collect a debt and any information obtained will be used for that purpose.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} ${companyName} &bull; Transmitted via Recovra Recovery Platform
          </div>
        </div>
      </body>
    </html>
  `;

  const config = getSmtpConfig();
  const brandSender = `"${companyName}" <${config.user || 'recovraai@gmail.com'}>`;

  return sendEmail({
    from: brandSender,
    to: account.email,
    subject,
    html,
    text: `${headerTitle}\n\nDear ${account.name},\n\nThis notice confirms your call on ${dateFormatted} regarding ${creditor} (Ref: ${account.accountNumber || account.id}). Outstanding balance: ${balanceStr}.\n\nThis is an attempt to collect a debt and any information obtained will be used for that purpose.`,
  });
}
