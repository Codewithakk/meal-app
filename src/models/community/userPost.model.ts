import mongoose, { Schema } from 'mongoose';
import { IPost } from '../../interfaces/post';

const postSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    groupchallengeId: { type: Schema.Types.ObjectId, ref: "GroupChallenge" },
    title: { type: String, required: true },
    description: { type: String },
    about: { type: String },
    images: [{ type: String }],
    hashtags: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    shares: { type: Number, default: 0 },
    viewcount: { type: Number, default: 0 },
    comments: [
      {
        text: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IPost>('Post', postSchema);
