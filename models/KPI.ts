import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IKPI {
  _id?: string;
  userId: Types.ObjectId | string;
  metric: string;
  value: number;
  target: number;
  unit: string;
  period: string;
  createdAt?: Date;
}

const KPISchema = new Schema<IKPI>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  metric: { type: String, required: true },
  value: { type: Number, required: true },
  target: { type: Number, required: true },
  unit: { type: String, required: true },
  period: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const KPI: Model<IKPI> = mongoose.models.KPI || mongoose.model<IKPI>('KPI', KPISchema);

export default KPI;
