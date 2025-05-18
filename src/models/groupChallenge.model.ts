import mongoose, { Document, Schema } from 'mongoose'

export interface IGroupChallenge extends Document {
    group: mongoose.Types.ObjectId
    title: string
    description: string
    challengeImage?: string
    startDate?: Date
    endDate?: Date
    status: 'open' | 'close' | 'upcoming'
    join_challenge: mongoose.Types.ObjectId[]
    createdAt: Date
    updatedAt?: Date
}

const GroupChallengeSchema: Schema = new Schema<IGroupChallenge>({
    group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    challengeImage: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ['open', 'close', 'upcoming'], required: true, default: 'upcoming' },
    join_challenge: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: () => new Date() },
    updatedAt: { type: Date }
})

export const GroupChallenge = mongoose.model<IGroupChallenge>('GroupChallenge', GroupChallengeSchema)
