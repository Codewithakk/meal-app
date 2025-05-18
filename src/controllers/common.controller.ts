import { Request, Response, NextFunction } from 'express'
import { DietTypeModel } from '../models/dietType.model'
import { FoodAllergyModel } from '../models/foodAllergy'
import { MoodGoalModel } from '../models/moodGoal'
import { ActivityLevelModel } from '../models/ActivityLevel.model'
import httpResponse from '../utils/httpResponse'
import httpError from '../utils/httpError'
import recipeModel from '../models/recipe.model'
import { deleteImages } from '../utils/deleteImage'

/** ========================= Create Diet Type ========================= **/
export const createDietType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name } = req.body
        const img = req.file ? req.file.path : null
        console.log('Request body:', req.body)
        console.log('Request file:', req.file)

        if (!name) {
            return httpResponse(req, res, 400, 'Diet type name is required')
        }

        const existingDietType = await DietTypeModel.findOne({ name })
        if (existingDietType) {
            return httpResponse(req, res, 400, 'Diet type already exists')
        }
        const newDietType = new DietTypeModel({ name, img })
        await newDietType.save()

        return httpResponse(req, res, 201, 'Diet type created successfully', { dietType: newDietType })
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

/** ========================= Update Diet Type by ID ========================= **/
export const updateDietType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId
        const { name } = req.body
        const img = req.file ? req.file.path : null

        const updatedDietType = await DietTypeModel.findByIdAndUpdate(userId, { name, img }, { new: true })

        if (!updatedDietType) {
            return httpResponse(req, res, 404, 'DietType not found')
        }

        return httpResponse(req, res, 200, 'DietType updated successfully', { updatedDietType })
    } catch (err) {
        console.error('Error updating DietType:', err)
        httpError(next, err, req, 500)
    }
}

/** ========================= Create Food Allergy ========================= **/
export const createFoodAllergy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name } = req.body
        const img = req.file ? req.file.path : null

        const existingFoodAllergy = await FoodAllergyModel.findOne({ name })
        if (existingFoodAllergy) {
            return httpResponse(req, res, 400, 'FoodAllergy with this name already exists')
        }

        const newFoodAllergy = new FoodAllergyModel({ name, img })
        await newFoodAllergy.save()

        return httpResponse(req, res, 201, 'FoodAllergy created successfully', { newFoodAllergy })
    } catch (err) {
        console.error('Error creating FoodAllergy:', err)
        httpError(next, err, req, 500)
    }
}

/** ========================= Update Food Allergy by ID ========================= **/
export const updateFoodAllergy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params
        const { name } = req.body
        const img = req.file ? req.file.path : null

        const updatedFoodAllergy = await FoodAllergyModel.findByIdAndUpdate(id, { name, img }, { new: true })

        if (!updatedFoodAllergy) {
            return httpResponse(req, res, 404, 'FoodAllergy not found')
        }

        return httpResponse(req, res, 200, 'FoodAllergy updated successfully', { updatedFoodAllergy })
    } catch (err) {
        console.error('Error updating FoodAllergy:', err)
        httpError(next, err, req, 500)
    }
}

/** ========================= Create Mood Goal ========================= **/
export const createMoodGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, description } = req.body
        const emoji = req.file ? req.file.path : null

        const existingMoodGoal = await MoodGoalModel.findOne({ name })
        if (existingMoodGoal) {
            return httpResponse(req, res, 400, 'MoodGoal with this name already exists')
        }
        const newMoodGoal = new MoodGoalModel({ name, description, emoji })
        await newMoodGoal.save()

        return httpResponse(req, res, 201, 'MoodGoal created successfully', { newMoodGoal })
    } catch (err) {
        console.error('Error creating MoodGoal:', err)
        httpError(next, err, req, 500)
    }
}

/** ========================= Update Mood Goal by ID ========================= **/
export const updateMoodGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params
        const { name, description } = req.body
        const emoji = req.file ? req.file.path : null

        const updatedMoodGoal = await MoodGoalModel.findByIdAndUpdate(id, { name, description, emoji }, { new: true })

        if (!updatedMoodGoal) {
            return httpResponse(req, res, 404, 'MoodGoal not found')
        }

        return httpResponse(req, res, 200, 'MoodGoal updated successfully', { updatedMoodGoal })
    } catch (err) {
        console.error('Error updating MoodGoal:', err)
        httpError(next, err, req, 500)
    }
}

/** ========================= Create Activity Level ========================= **/
export const createActivityLevel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { level, description } = req.body

        const existingActivityLevel = await ActivityLevelModel.findOne({ level })
        if (existingActivityLevel) {
            return httpResponse(req, res, 400, 'ActivityLevel with this level already exists')
        }

        const newActivityLevel = new ActivityLevelModel({ level, description })
        await newActivityLevel.save()

        return httpResponse(req, res, 201, 'ActivityLevel created successfully', { newActivityLevel })
    } catch (err) {
        console.error('Error creating ActivityLevel:', err)
        httpError(next, err, req, 500)
    }
}

/** ========================= Update Activity Level by ID ========================= **/
export const updateActivityLevel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params
        const { level, description } = req.body

        const updatedActivityLevel = await ActivityLevelModel.findByIdAndUpdate(id, { level, description }, { new: true })

        if (!updatedActivityLevel) {
            return httpResponse(req, res, 404, 'ActivityLevel not found')
        }

        return httpResponse(req, res, 200, 'ActivityLevel updated successfully', { updatedActivityLevel })
    } catch (err) {
        console.error('Error updating ActivityLevel:', err)
        httpError(next, err, req, 500)
    }
}

/** ========================= Create Recipe ========================= **/
export const createRecipe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const recipeData = req.body

        // Ensure numbers are stored correctly as numbers
        const numericFields = ['rating', 'prepTime', 'calories', 'protein']
        numericFields.forEach((field) => {
            if (recipeData[field] !== undefined) {
                recipeData[field] = Number(recipeData[field])
                if (isNaN(recipeData[field])) {
                    return res.status(400).json({ message: `Invalid value for ${field}. Must be a number.` })
                }
            }
        })

        // Handle main recipe image upload
        if (req.file) {
            recipeData.imageUrl = req.file.path
        }

        // Ensure `ingredients` is parsed properly (from JSON string if necessary)
        if (typeof recipeData.ingredients === 'string') {
            recipeData.ingredients = JSON.parse(recipeData.ingredients)
        }

        // ✅ Explicitly type `req.files` as an object with string keys
        const files = req.files as { [fieldname: string]: Express.Multer.File[] }

        // Handle ingredient images (if any are uploaded)
        if (files && files['ingredientImages']) {
            const ingredientImages = files['ingredientImages']

            recipeData.ingredients.forEach((ingredient: { ingredientImg: string }, index: number) => {
                if (ingredientImages[index]) {
                    ingredient.ingredientImg = ingredientImages[index].path
                }
            })
        }

        // Validate required fields
        // const requiredFields = ["name", "description", "rating", "prepTime", "calories", "protein", "mood", "mealType", "ingredients", "instructions", "benefits"];
        // for (const field of requiredFields) {
        //   if (!recipeData[field] || (Array.isArray(recipeData[field]) && recipeData[field].length === 0)) {
        //      res.status(400).json({ message: `${field} is required.` });
        //   }
        // }

        // Create new recipe document
        const recipe = new recipeModel(recipeData)
        const savedRecipe = await recipe.save()

        res.status(201).json({
            message: 'Recipe created successfully',
            recipe: savedRecipe
        })
    } catch (error) {
        next(error)
    }
}

export const updateRecipe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { recipeId } = req.params
        const updateData = req.body

        // Find recipe by ID
        const recipe = await recipeModel.findById(recipeId)
        if (!recipe) {
            res.status(404).json({ message: 'Recipe not found.' })
            return
        }

        // Ensure numbers are stored correctly as numbers
        const numericFields = ['rating', 'prepTime', 'calories', 'protein']
        numericFields.forEach((field) => {
            if (updateData[field] !== undefined) {
                updateData[field] = Number(updateData[field])
                if (isNaN(updateData[field])) {
                    res.status(400).json({ message: `Invalid value for ${field}. Must be a number.` })
                    return
                }
            }
        })

        // Handle main recipe image upload
        if (req.file) {
            updateData.imageUrl = req.file.path
        }

        // Parse ingredients if it's a string
        if (typeof updateData.ingredients === 'string') {
            updateData.ingredients = JSON.parse(updateData.ingredients)
        }

        // Handle ingredient images
        const files = req.files as { [fieldname: string]: Express.Multer.File[] }
        if (files && files['ingredientImages']) {
            const ingredientImages = files['ingredientImages']
            if (updateData.ingredients && Array.isArray(updateData.ingredients)) {
                updateData.ingredients.forEach((ingredient: { ingredientImg: string }, index: number) => {
                    if (ingredientImages[index]) {
                        ingredient.ingredientImg = ingredientImages[index].path
                    }
                })
            }
        }

        // Find recipe and update
        const updatedRecipe = await recipeModel.findByIdAndUpdate(recipeId, updateData, {
            new: true,
            runValidators: true
        })

        res.status(200).json({
            message: 'Recipe updated successfully',
            recipe: updatedRecipe
        })
    } catch (error) {
        next(error)
    }
}

export const deleteRecipe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { recipeId } = req.params

        // Find recipe by ID
        const recipe = await recipeModel.findById(recipeId)
        if (!recipe) {
            res.status(404).json({ message: 'Recipe not found.' })
            return
        }

        // Delete main recipe image
        if (recipe.imageUrl) {
            const match = recipe.imageUrl?.match(/upload\/(?:v\d+\/)?(.+?)\.[^\/]+$/)
            const imageName = match ? match[1] : ''
            if (imageName != '') {
                await deleteImages([imageName])
            }
        }

        // Delete ingredient images
        if (Array.isArray(recipe.ingredients)) {
            recipe.ingredients.forEach(async (ingredient) => {
                if (ingredient.ingredientImg) {
                    const match = ingredient.ingredientImg?.match(/upload\/(?:v\d+\/)?(.+?)\.[^\/]+$/)
                    const imageName = match ? match[1] : ''
                    if (imageName != '') {
                        await deleteImages([imageName])
                    }
                }
            })
        }

        // Delete the recipe document
        await recipeModel.findByIdAndDelete(recipeId)

        res.status(200).json({ message: 'Recipe deleted successfully.' })
    } catch (error) {
        next(error)
    }
}

export const deleteRecipeImages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { recipeId } = req.params
        const { imagePaths } = req.body // imagePaths: string[]

        if (!Array.isArray(imagePaths)) {
            res.status(400).json({ message: 'imagePaths must be an array.' })
            return
        }

        // Find recipe by ID
        const recipe = await recipeModel.findById(recipeId)
        if (!recipe) {
            res.status(404).json({ message: 'Recipe not found.' })
            return
        }

        // if (recipe.imageUrl && imagePaths.includes(recipe.imageUrl)) {
        //   recipe.imageUrl = "";
        // }

        if (Array.isArray(recipe.ingredients)) {
            for (const ingredient of recipe.ingredients) {
                if (ingredient.ingredientImg && imagePaths.includes(ingredient.ingredientImg)) {
                    ingredient.ingredientImg = ''
                }
            }
        }

        const imageNamesToDelete: string[] = imagePaths
            .map((path: string) => {
                const match = path.match(/upload\/(?:v\d+\/)?(.+?)\.[^\/]+$/)
                return match ? match[1] : null
            })
            .filter((name): name is string => name !== null) // Remove nulls

        if (imageNamesToDelete.length > 0) {
            await deleteImages(imageNamesToDelete)
        }

        // Save the updated recipe
        await recipe.save()

        res.status(200).json({ message: 'Recipe images deleted successfully.' })
    } catch (error) {
        next(error)
    }
}
