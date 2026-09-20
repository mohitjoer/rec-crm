import { Document, model, models, Schema } from 'mongoose';

export interface DebtorDocument extends Document {
  account_number: string;
  full_name: string;
  email?: string;
  contact: {
    phone_e164: string;
    preferred_channel: 'voice' | 'whatsapp' | 'sms' | 'email';
    language_pref: string;
    timezone: string;
  };
  financial: {
    amount_due: number;
    currency: string;
    due_date: Date;
    invoice_reference?: string;
    original_amount: number;
    age_days: number;
  };
  status: string;
  sequence_stage: string;
  do_not_contact_until?: Date;
  promised_date?: string;
  promise_to_pay?: {
    amount: number;
    date: string;
    method?: string;
    status: string;
  };
  max_daily_attempts: number;
  attempts_today: number;
  interaction_history: Array<{
    timestamp: Date;
    type: string;
    outcome_type: string;
    outcome_payload?: Record<string, any>;
    duration_seconds?: number;
    notes?: string;
    agent_id?: string;
  }>;
  created_at: Date;
  updated_at: Date;
  last_contacted?: Date;
  __v?: number;
}

const DebtorSchema = new Schema<DebtorDocument>(
  {
    account_number: { type: String, required: true, unique: true },
    full_name: { type: String, required: true },
    email: { type: String },
    contact: {
      phone_e164: { type: String, required: true },
      preferred_channel: { type: String, required: true, enum: ['voice', 'whatsapp', 'sms', 'email'] },
      language_pref: { type: String, required: true },
      timezone: { type: String, required: true },
    },
    financial: {
      amount_due: { type: Number, required: true },
      currency: { type: String, required: true, default: 'USD' },
      due_date: { type: Date, required: true },
      invoice_reference: { type: String },
      original_amount: { type: Number, required: true },
      age_days: { type: Number, required: true },
    },
    status: { type: String, required: true, default: 'current' },
    sequence_stage: { type: String, required: true, default: 'reminder_1' },
    do_not_contact_until: { type: Date },
    max_daily_attempts: { type: Number, default: 3 },
    attempts_today: { type: Number, default: 0 },
    interaction_history: [
      {
        timestamp: { type: Date, default: Date.now },
        type: { type: String, required: true },
        outcome_type: { type: String, required: true },
        outcome_payload: { type: Schema.Types.Mixed },
        duration_seconds: { type: Number },
        notes: { type: String },
        agent_id: { type: String },
      },
    ],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    last_contacted: { type: Date },
  },
  { timestamps: true }
);

export const Debtor = models.Debtor || model<DebtorDocument>('Debtor', DebtorSchema);
export { DebtorSchema };