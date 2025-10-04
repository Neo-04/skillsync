import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IAPAR {
  _id?: string;
  userId: Types.ObjectId | string;
  year: number;
  period: string;
  achievements: string;
  challenges: string;
  goals: string;
  draft?: string;
  status: 'draft' | 'submitted' | 'reviewed';
  createdAt?: Date;
}

const APARSchema = new Schema<IAPAR>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  year: { type: Number, required: true },
  period: { type: String, required: true },
  achievements: { type: String, required: true },
  challenges: { type: String, required: true },
  goals: { type: String, required: true },
  draft: { type: String },
  status: { type: String, enum: ['draft', 'submitted', 'reviewed'], default: 'draft' },
  createdAt: { type: Date, default: Date.now }
});

const APAR: Model<IAPAR> = mongoose.models.APAR || mongoose.model<IAPAR>('APAR', APARSchema);

export default APAR;
