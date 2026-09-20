export type DpdBucket = '30_DPD' | '60_DPD' | '90_DPD' | '120_PLUS_CHARGE_OFF';

export type AccountStatus =
  | 'ACTIVE'
  | 'PROMISE_TO_PAY'
  | 'INSTALLMENT_PLAN'
  | 'SETTLED'
  | 'DISPUTED'
  | 'HARDSHIP_HOLD'
  | 'UNREACHABLE';

export interface Note {
  id: string;
  text: string;
  date: string;
  author: string;
}

export interface PaymentPlan {
  monthlyAmount: number;
  months: number;
  startDate: string;
  remainingBalance: number;
}

export interface PromiseToPay {
  amount: number;
  date: string;
  method: string;
  status: 'PENDING' | 'KEPT' | 'BROKEN';
}

export interface Account {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email: string;
  country?: string;
  overdueAmount?: number;
  predueAmount?: number;
  externalUserId?: string;
  metadata?: Record<string, any>;
  originalCreditor: string;
  accountNumber: string;
  originalBalance: number;
  currentBalance: number;
  daysPastDue: number;
  bucket: DpdBucket;
  status: AccountStatus;
  riskScore: number;
  maxDiscountPercent: number;
  assignedCampaign?: string;
  lastContactDate?: string;
  nextActionDate?: string;
  notes: Note[];
  paymentPlan?: PaymentPlan;
  promiseToPay?: PromiseToPay;
}

export type CallDisposition =
  | 'PROMISE_TO_PAY'
  | 'SETTLEMENT_OFFERED'
  | 'PAYMENT_PLAN'
  | 'DISPUTE_RAISED'
  | 'HARDSHIP'
  | 'CALL_BACK'
  | 'REFUSAL'
  | 'NO_ANSWER'
  | 'VOICEMAIL';

export interface TranscriptMessage {
  id: string;
  speaker: 'agent' | 'debtor' | 'system';
  text: string;
  timestamp: string;
  sentiment?: 'positive' | 'neutral' | 'defensive' | 'anxious' | 'angry';
}

export interface CallRecord {
  id: string;
  userId?: string;
  accountId: string;
  debtorName: string;
  startTime: string;
  durationSeconds: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED' | 'VOICEMAIL';
  disposition: CallDisposition;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'DEFENSIVE' | 'ANXIOUS' | 'ANGRY';
  complianceScore: number;
  miniMirandaPassed: boolean;
  transcript: TranscriptMessage[];
  summary: string;
  amountPromised?: number;
  promisedDate?: string;
}

export interface Campaign {
  id: string;
  userId?: string;
  name: string;
  targetBucket: string;
  totalAccounts: number;
  completedCalls: number;
  connectedRate: number;
  ptpRate: number;
  recoveredAmount: number;
  status: 'RUNNING' | 'PAUSED' | 'SCHEDULED' | 'COMPLETED';
  createdAt: string;
}

export interface QueueSettings {
  id: string;
  userId?: string;
  brandName?: string;
  companyName?: string;
  reattemptIntervalMinutes: number;
  maxReattempts: number;
  autoReattemptEnabled: boolean;
  customPrompt?: string;
  greetingTemplate?: string;
  webhookKey?: string;
  updatedAt: string;
}

export type QueuedCallStatus = 'QUEUED' | 'DUE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXHAUSTED';

export interface QueuedCall {
  id: string;
  userId?: string;
  accountId: string;
  debtorName: string;
  phoneNumber: string;
  originalCreditor: string;
  currentBalance: number;
  lastAttemptAt: string;
  lastDisposition: CallDisposition;
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt: string;
  status: QueuedCallStatus;
  createdAt: string;
  notes?: string;
}

export interface DailyInteractionPoint {
  day: string;
  date: string;
  value: number;
  [key: string]: unknown;
}

export interface DashboardStats {
  dailyTrend: DailyInteractionPoint[];
  trendSummary: {
    total: number;
    avgPerDay: number;
    peak: number;
    daysCount: number;
  };
  channelBreakdown: {
    voice: number;
    message: number;
    email: number;
    total: number;
  };
  outreachOutcome: {
    completed: number;
    responded: number;
    notResponded: number;
    totalSessions: number;
  };
  portfolioSummary: {
    totalAccounts: number;
    totalBalance: number;
    totalOverdue: number;
    promisedAmount: number;
    queuedCallsCount: number;
  };
}

export interface InboundClientPayload {
  name: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  country?: string;
  countryCode?: string;
  overdueAmount: number;
  predueAmount?: number;
  accountNumber?: string;
  originalCreditor?: string;
  metadata?: {
    userId?: string;
    [key: string]: any;
  };
  externalUserId?: string;
  notes?: string;
}

export interface WebhookLog {
  id: string;
  userId: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
  statusCode: number;
  action?: 'CREATED' | 'UPDATED' | 'DELETED' | 'SKIPPED';
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  country?: string;
  overdueAmount?: number;
  predueAmount?: number;
  accountId?: string;
  payload: Record<string, any>;
  response: Record<string, any>;
  error?: string;
  sourceIp?: string;
}

export interface WebhookConfig {
  webhookUrl: string;
  webhookKey: string;
  totalReceived: number;
  lastReceivedAt?: string;
}
