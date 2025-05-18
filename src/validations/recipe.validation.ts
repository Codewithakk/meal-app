import { z } from 'zod'

export const recipeSchema = z.object({
    name: z.string(),
    description: z.string(),
    rating: z.number().min(0).max(5),
    prepTime: z.number().nonnegative(),
    calories: z.number().nonnegative(),
    protein: z.number().nonnegative(),
    mood: z.string(),
    mealType: z.string(),
    imageUrl: z.string().url().optional(),
    ingredients: z.array(
        z.object({
            ingredientName: z.string(),
            quantity: z.string(),
            ingredientImg: z.string().url(),
            notes: z.string()
        })
    ),
    instructions: z.array(
        z.object({
            step: z.number().int().positive(),
            title: z.string(),
            descriptions: z.array(z.string())
        })
    ),
    benefits: z.array(
        z.object({
            title: z.string(),
            description: z.string()
        })
    )
})
