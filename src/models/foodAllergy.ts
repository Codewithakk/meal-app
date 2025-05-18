import mongoose, { Schema } from 'mongoose'

/** ✅ FoodAllergy Model */
const FoodAllergySchema: Schema = new Schema(
    {
        name: { type: String, required: true }, // Name of the allergy (e.g., Peanuts, Dairy, etc.)
        img: { type: String } // image of the allergy (e.g., Mild, Severe)
    },
    { timestamps: true }
)

export const FoodAllergyModel = mongoose.model('FoodAllergy', FoodAllergySchema)
