import mongoose, { Document, Schema } from "mongoose";


export interface IComment extends Document {
  text: string;
  user: Schema.Types.ObjectId;
  createdAt?: Date;
}

export interface IPost extends Document {
  user: Schema.Types.ObjectId;
  group: Schema.Types.ObjectId;
  groupchallengeId?: Schema.Types.ObjectId;
  title: string;
  description?: string;
  about?: string;
  images: string[];
  hashtags: string[];
  likes: Schema.Types.ObjectId[];
  dislikes: Schema.Types.ObjectId[];
  shares: number;
  viewcount: number;
  comments: IComment[];
  createdAt?: Date;
  updatedAt?: Date;
}
