import { NextFunction, Request, Response } from 'express'
import User from '../../models/user.model'
import mongoose from 'mongoose'
import httpResponse from '../../utils/httpResponse'
import httpError from '../../utils/httpError'
import { FoodAllergyModel } from '../../models/foodAllergy'
import { ActivityLevelModel } from '../../models/ActivityLevel.model'
import { DietTypeModel } from '../../models/dietType.model'

export const onboardingController = {
    selectDietType: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId
            const { dietTypes } = req.body

            if (!userId || !Array.isArray(dietTypes) || dietTypes.length === 0) {
                return httpResponse(req, res, 400, 'User ID and at least one diet type are required')
            }

            const user = await User.findByIdAndUpdate(userId, { dietTypes }, { new: true }).populate('dietTypes', '_id name img').lean()

            if (!user) return httpResponse(req, res, 404, 'User not found')

            return httpResponse(req, res, 200, 'Diet types updated', { user })
        } catch (error) {
            return httpError(next, error, req, 500)
        }
    },

    getAllDietType: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dietTypes = await DietTypeModel.find({}, { _id: 1, name: 1, img: 1 }).lean()

            return httpResponse(req, res, 200, 'Dietary preferences found', { dietTypes })
        } catch (error) {
            return httpError(next, error, req, 500)
        }
    },

    selectAllergies: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId
            const { allergies } = req.body

            if (!userId || !Array.isArray(allergies) || allergies.length === 0) {
                return httpResponse(req, res, 400, 'User ID and at least one allergy are required')
            }

            const validAllergies = await FoodAllergyModel.find({ _id: { $in: allergies } })
                .select('_id name')
                .lean()

            if (validAllergies.length !== allergies.length) {
                return httpResponse(req, res, 404, 'Some allergies not found')
            }

            const user = await User.findByIdAndUpdate(userId, { allergies }, { new: true }).populate('allergies', '_id name img').lean()

            if (!user) return httpResponse(req, res, 404, 'User not found')

            return httpResponse(req, res, 200, 'Allergies updated successfully')
        } catch (error) {
            return httpError(next, error, req, 500)
        }
    },

    getAllAllergies: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const allergies = await FoodAllergyModel.find({}, { _id: 1, name: 1, img: 1 }).lean()

            return httpResponse(req, res, 200, 'Allergy options found', { allergies })
        } catch (error) {
            return httpError(next, error, req, 500)
        }
    },

    profileDetails: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId
            if (!userId) return httpResponse(req, res, 400, 'User ID is required')

            const user = await User.findById(userId).lean()

            if (!user) return httpResponse(req, res, 404, 'User not found')

            return httpResponse(req, res, 200, 'Profile details retrieved', { user })
        } catch (error) {
            return httpError(next, error, req, 500)
        }
    },

    profileUpdate: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId
            const { gender, age, weight, height } = req.body

            if (!userId) {
                return httpResponse(req, res, 401, 'Unauthorized: User ID is missing')
            }

            if (gender === undefined && age === undefined && weight === undefined && height === undefined) {
                return httpResponse(req, res, 400, 'At least one field (gender, age, weight, height) must be provided')
            }

            const updateFields: Partial<{ gender: string; age: string; weight: string; height: string }> = {}

            if (gender !== undefined) {
                const allowedGenders = ['male', 'female', 'other']
                if (!allowedGenders.includes(gender.toLowerCase())) {
                    return httpResponse(req, res, 400, "Invalid gender: Must be 'male', 'female', or 'other'")
                }
                updateFields.gender = gender.toLowerCase()
            }

            if (age !== undefined) {
                const ageStr = String(age).trim()
                if (!/^\d+$/.test(ageStr) || parseInt(ageStr) <= 0) {
                    return httpResponse(req, res, 400, 'Invalid age: Must be a positive integer string')
                }
                updateFields.age = ageStr
            }

            if (weight !== undefined) {
                const weightStr = String(weight).trim()
                if (!/^\d+(\.\d+)?$/.test(weightStr) || parseFloat(weightStr) <= 0) {
                    return httpResponse(req, res, 400, 'Invalid weight: Must be a positive number string')
                }
                updateFields.weight = weightStr
            }

            // Validate height if provided
            // if (height !== undefined) {
            //   const heightStr = String(height).trim();
            //   if (!/^\d+(\.\d+)?$/.test(heightStr) || parseFloat(heightStr) <= 0) {
            //     return httpResponse(req, res, 400, "Invalid height: Must be a positive number string");
            //   }
            updateFields.height = height
            // }

            const user = await User.findByIdAndUpdate(userId, { $set: updateFields }, { new: true }).select('gender age weight height').lean()

            if (!user) {
                return httpResponse(req, res, 404, 'User not found')
            }

            return httpResponse(req, res, 200, 'Profile updated successfully', { user })
        } catch (error) {
            return httpError(next, error, req, 500)
        }
    },

    activityLevel: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId
            const { activityLevelid } = req.params

            if (!userId || !activityLevelid) {
                return httpResponse(req, res, 400, 'User ID and activity level are required')
            }

            if (!mongoose.isValidObjectId(activityLevelid)) {
                return httpResponse(req, res, 400, 'Invalid activity level ID')
            }

            const activity = await ActivityLevelModel.findById(activityLevelid).lean()
            if (!activity) {
                return httpResponse(req, res, 404, 'Activity Level not found')
            }

            const user = await User.findByIdAndUpdate(userId, { activityLevel: activityLevelid, onboardingCompleted: true }, { new: true })
                .select(
                    '_id activityLevel onboardingCompleted gender age weight height userName userEmail userProfile friends dietTypes allergies saved verified notifications likes createdAt updatedAt'
                )
                .lean()

            if (!user) {
                return httpResponse(req, res, 404, 'User not found')
            }

            return httpResponse(req, res, 200, 'Activity level updated successfully', { user })
        } catch (error) {
            return httpError(next, error, req, 500)
        }
    },

    getAllactivityLevel: async (req: Request, res: Response, next: NextFunction) => {
        try {
            console.time('Fetch Activity Levels')

            // Use projection and lean for speed, add a limit if needed
            const activityLevels = await ActivityLevelModel.find({}, { level: 1, description: 1, _id: 1 }) // efficient projection
                .lean() // skips Mongoose document overhead

            console.timeEnd('Fetch Activity Levels')

            if (!activityLevels?.length) {
                return httpResponse(req, res, 404, 'No activity levels found')
            }

            return httpResponse(req, res, 200, 'All Activity level', { activityLevels })
        } catch (error) {
            return httpError(next, error, req, 500)
        }
    }
}
