import { Document, model, models, Schema } from 'mongoose';

export interface UserDocument extends Document {
  email: string;
  password: string;
  name: string;
  role: 'Admin' | 'Recovery Officer' | 'AI Worker' | 'Viewer';
  organization: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['Admin', 'Recovery Officer', 'AI Worker', 'Viewer'],
      default: 'Recovery Officer'
    },
    organization: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

export const User = models.User || model<UserDocument>('User', UserSchema);
export { UserSchema };