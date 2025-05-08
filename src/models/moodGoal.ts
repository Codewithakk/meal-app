import mongoose, { Schema, Document } from "mongoose";

export interface MoodGoal{
  name: string
  description: string
  emoji?: string 
}

/** ✅ MoodGoal Model */
const MoodGoalSchema: Schema = new Schema(
  {
    name: { type: String, required: true }, // Name of the mood goal (e.g., "Improve Focus", "Reduce Stress")
    description: { type: String, required: true }, // Description of the mood goal
    emoji: { type: String, required: true , default:"https://emoji.aranja.com/static/emoji-data/img-apple-160/1f60a.png" }, // Emoji associated with the mood goal
  },
  { timestamps: true }
);

export const MoodGoalModel = mongoose.model("MoodGoal", MoodGoalSchema);
