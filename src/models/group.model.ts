import mongoose, { Document, Schema } from 'mongoose';

export interface IJoinGroup extends Document {
  isOwner?: boolean;
  user: mongoose.Types.ObjectId;
  createdAt?: Date;
}

export interface IGroup extends Document {
  title: string;
  groupProfile: string;
  join_group: IJoinGroup[];
  createdAt: Date;
  updatedAt?: Date;
}

const GroupSchema: Schema = new Schema<IGroup>({
  title: {
    type: String,
    required: true
  },
  groupProfile: { type: String },
  join_group: [
    {
      isOwner: { type: Boolean, default: false },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: () => new Date()
  },
  updatedAt: {
    type: Date
  }
});

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
