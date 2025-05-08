import mongoose, { Schema, Document, model } from "mongoose";
import { Review } from "../models/review.model";

// **Ingredient Interface**
interface Ingredient {
  ingredientName: string;
  quantity?: string;
  ingredientImg?: string;
  notes?: string;
}

// **Instruction Interface**
interface Instruction {
  step: number;
  title:string;
  descriptions: string[];
}

// **Benefits Interface**
interface Benefits {
  title: string;
  description: string;
}

// **Recipe Interface**
export interface Recipe extends Document {
  name: string;
  description:string;
  rating: number;
  prepTime: number;
  protein: number;
  calories: number;
  mood: string;
  mealType: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  benefits: Benefits[];
  reviews: Review[];
  imageUrl: string;
}

// **Ingredient Schema**
const ingredientSchema = new Schema<Ingredient>(
  {
    ingredientName: { type: String, required: true },
    quantity: { type: String }, // Quantity and unit (e.g., "2 cups", "1 lb")
    ingredientImg: { type: String }, // URL or path to the ingredient image
    notes: { type: String }, // Additional notes about the ingredient (e.g., for seasoning)

  },
);

// **Instruction Schema**
const instructionSchema = new Schema<Instruction>(
  {
    step: { type: Number, required: true },
    title: { type: String, required: true },
    descriptions: { type: [String], required: true }, // Array of descriptions
  },
  { _id: false }
);

// **Benefits Schema**
const benefitsSchema = new Schema<Benefits>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

// **Recipe Schema**
const recipeSchema = new Schema<Recipe>(
  {
    name: { type: String, required: true },
    description:{ type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    prepTime: { type: Number, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true }, // Fixed this
    mood: { type: String, required: true },
    mealType: { type: String, required: true },
    ingredients: { type: [ingredientSchema], required: true },
    instructions: { type: [instructionSchema], required: true },
    benefits: { type: [benefitsSchema], required: true },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

// **Export Recipe Model**
export default model<Recipe>("Recipe", recipeSchema);
