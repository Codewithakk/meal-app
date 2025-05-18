import mongoose, { Schema } from 'mongoose'

/** ✅ ActivityLevel Model */
const ActivityLevelSchema: Schema = new Schema(
    {
        level: { type: String, required: true }, // The level of activity (e.g., Sedentary, Active, Very Active)
        description: { type: String, required: true } // A description of what each activity level means
    },
    { timestamps: true }
)

export const ActivityLevelModel = mongoose.model('ActivityLevel', ActivityLevelSchema)
