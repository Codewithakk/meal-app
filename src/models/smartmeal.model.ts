import mongoose from "mongoose";

const ChatHistorySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // Store user ID
    userPrompt: { type: String, required: true },
    response: { type: String, required: true },
    feedback: { type: String, enum: ["like", "unlike", "none"], default: "none", required: true },
  },
  { timestamps: true }
);

export const ChatHistory = mongoose.model("ChatHistory", ChatHistorySchema);
