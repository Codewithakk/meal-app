import mongoose, { Schema, Document } from "mongoose";

/** ✅ DietType Model */
const DietTypeSchema: Schema = new Schema(
  {
    name: { type: String, required: true }, // Name of the diet type (e.g., Vegan, Keto, etc.)
    img: { type: String }, // image of the diet type
  },
  { timestamps: true }
);

export const DietTypeModel = mongoose.model("DietType", DietTypeSchema);
