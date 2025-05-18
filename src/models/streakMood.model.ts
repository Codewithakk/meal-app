// models/MoodEntry.ts
import mongoose, { Document, Schema } from 'mongoose'

export interface IMoodGoal extends Document {
    mood: Schema.Types.ObjectId
    createdAt?: Date
}

export interface IStreakMoodEntry extends Document {
    userId: mongoose.Types.ObjectId
    moodGoal: IMoodGoal[]
}

const StreakMoodSchema = new Schema<IStreakMoodEntry>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        moodGoal: [
            {
                mood: { type: Schema.Types.ObjectId, ref: 'MoodGoal' },
                createdAt: { type: Date, default: Date.now }
            }
        ]
    },
    {
        timestamps: { createdAt: true }
    }
)

export const StreakMood = mongoose.model<IStreakMoodEntry>('StreakMood', StreakMoodSchema)
