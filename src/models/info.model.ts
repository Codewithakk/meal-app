import { Schema, model, Document } from 'mongoose';

export interface InfoDocument extends Document {
  type: 'privacy' | 'help' | 'about';
  content: string;
  updatedAt: Date;
  imgs?: string;
}

const infoSchema = new Schema<InfoDocument>({
  type: { type: String, enum: ['privacy', 'help', 'about'], required: true, unique: true },
  content: { type: String, required: true },
  imgs: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

export const InfoModel = model<InfoDocument>('Info', infoSchema);
