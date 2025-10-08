import mongoose, { Schema, Model } from 'mongoose';

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: 'hq_staff' | 'field_staff' | 'admin' | 'super_admin' | 'employee';
  department?: string;
  position?: string;
  themePreference?: 'light' | 'dark' | 'system';
  createdAt?: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['hq_staff', 'field_staff', 'admin', 'super_admin', 'employee'], default: 'employee' },
  department: { type: String },
  position: { type: String },
  themePreference: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  createdAt: { type: Date, default: Date.now }
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
