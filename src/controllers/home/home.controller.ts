import { NextFunction, Request, Response } from 'express'
import User from '../../models/user.model'
import Recipe from '../../models/recipe.model'
import httpResponse from '../../utils/httpResponse'
import httpError from '../../utils/httpError'
import { getBaseUrl } from '../../utils/baseUrl'
import mongoose from 'mongoose'
import redisClient from '../../cache/redisClient'

export const homeController = {
    shareRecipe: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { recipeId } = req.params
            if (!recipeId) return httpResponse(req, res, 400, 'Recipe ID is required')

            return httpResponse(req, res, 200, 'Recipe shareable link generated', {
                shareableLink: `${getBaseUrl()}/api/v1/home/recipeDetails?recipeid=${recipeId}`
            })
        } catch (error) {
            next(httpError(next, error, req, 500))
        }
    },

    heroAndTopMealOfDay: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId
            console.log('User ID:', userId) // Log the userId for debugging
            if (!userId) {
                return next(httpError(next, 'Unauthorized', req, 401))
            }

            const userData = await User.findById(userId)
                .select('userName userProfile moodGoal likes')
                .populate({
                    path: 'moodGoal',
                    model: 'MoodGoal',
                    select: 'name emoji' // Select only necessary fields
                })
                .lean()

            if (!userData) {
                return next(httpError(next, 'User not found', req, 404))
            }

            // Convert user's liked recipes into a Set for quick lookup
            const likedRecipeIds = new Set(userData.likes?.map((like) => like.recipe) || [])

            const topRatedMeals = await Recipe.aggregate([
                { $sort: { rating: -1 } }, // Sort by highest rating
                { $limit: 6 }, // Get top 6 meals
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        imageUrl: 1,
                        rating: 1,
                        prepTime: 1,
                        likes: 1,
                        isFavorite: { $in: ['$_id', likedRecipeIds] }
                    }
                }
            ]) || []

            return httpResponse(req, res, 200, 'Hero and top meals fetched successfully', {
                Hero: {
                    name: userData.userName,
                    profile: userData.userProfile || null,
                    moodGoal: userData.moodGoal || null
                },
                TopRatedMeals: topRatedMeals
            })
        } catch (error) {
            return next(httpError(next, error, req, 500))
        }
    },

    getUserMoodGoals: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId
            if (!userId) return httpResponse(req, res, 400, 'User ID is required')

            const user = await User.findById(userId)
                .populate({
                    path: 'moodGoal',
                    model: 'MoodGoal',
                    select: 'name emoji'
                })
                .select('moodGoal -_id')
                .lean()

            if (!user?.moodGoal) {
                return httpResponse(req, res, 404, 'No Mood Goal found')
            }

            return httpResponse(req, res, 200, 'Mood goals retrieved successfully', user?.moodGoal)
        } catch (error) {
            return next(httpError(next, error, req, 500))
        }
    },

    mealofday: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId
            const [mealsOfDay, user] = await Promise.all([
                Recipe.aggregate([{ $sort: { rating: -1 } }, { $project: { _id: 1, name: 1, imageUrl: 1, rating: 1, prepTime: 1 } }]),
                userId ? User.findById(userId).select('likes').lean() : null
            ])

            if (!mealsOfDay.length) return httpResponse(req, res, 404, 'No meals found')

            const likedRecipes = new Set(user?.likes?.map((like) => like.recipe.toString()))
            return httpResponse(req, res, 200, 'Meals of the day fetched successfully', {
                mealsOfDay: mealsOfDay.map((meal) => ({ ...meal, isFavorite: likedRecipes.has(meal._id.toString()) }))
            })
        } catch (error) {
            next(httpError(next, error, req, 500))
        }
    },

    recipeDetail: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId
            const { recipeid } = req.query
            if (!recipeid) return next(httpError(next, 'Recipe ID is required', req, 400))

            // Fetch recipe details
            const details = await Recipe.findById(recipeid)
                .select('imageUrl mood name rating description prepTime calories protein ingredients instructions benefits')
                .populate('ingredients instructions benefits')
                .lean()

            if (!details) return next(httpError(next, 'Recipe not found', req, 404))

            let isFavorite = false

            if (userId) {
                // Fetch user likes and check if this recipe is in their liked list
                const user = await User.findById(userId).select('likes').lean()
                isFavorite = user?.likes?.some((like) => like.recipe.toString() === recipeid.toString()) || false
            }

            httpResponse(req, res, 200, 'Recipe details fetched successfully', {
                details: { ...details, isFavorite }
            })
        } catch (error) {
            next(httpError(next, error, req, 500))
        }
    },

    relatedMeals: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId
            if (!userId) return next(httpError(next, 'Unauthorized', req, 401))

            const user = await User.findById(userId)
                .select('moodGoal likes')
                .populate<{ moodGoal: { name: string } }>('moodGoal', 'name') // Define type explicitly
                .lean()

            if (!user?.moodGoal?.name) return next(httpError(next, 'MoodGoal not found', req, 404))

            const [relatedMeals] = await Promise.all([
                Recipe.find({ mood: user.moodGoal.name }).sort({ rating: -1 }).select('_id imageUrl name prepTime rating mood').lean()
            ])

            const likedRecipes = new Set(user.likes?.map((like) => like.recipe.toString()))
            return httpResponse(req, res, 200, 'Related meals fetched successfully', {
                RelatedMeals: relatedMeals.map((meal) => ({ ...meal, isFavorite: likedRecipes.has(meal._id.toString()) }))
            })
        } catch (error) {
            next(httpError(next, error, req, 500))
        }
    },

    MostLovedMeal: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId
            const user = userId ? await User.findById(userId).select('likes').lean() : null
            const likedRecipes = new Set(user?.likes?.map((like) => like.recipe.toString()) || [])

            const mostLovedMeals = await Recipe.find()
                .sort({ rating: -1 })
                .limit(5) // Adjust as needed
                .select('_id imageUrl name prepTime rating')
                .lean()

            const MostLovedMeals = mostLovedMeals.map((meal) => ({
                ...meal,
                isFavorite: likedRecipes.has(meal._id.toString())
            }))

            httpResponse(req, res, 200, 'Most loved meals fetched successfully', { MostLovedMeals })
        } catch (error) {
            next(httpError(next, error, req, 500))
        }
    },

    relatedMostLovedMeal: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId
            if (!userId) return next(httpError(next, 'Unauthorized', req, 401))

            const user = await User.findById(userId).select('moodGoal likes').populate<{ moodGoal: { name: string } }>('moodGoal', 'name').lean()

            const likedRecipeIds = new Set(user?.likes?.map((like) => like.recipe) || [])

            const [relatedMeals, mostLovedMeals] = await Promise.all([
                Recipe.aggregate([
                    { $match: { mood: user?.moodGoal?.name } },
                    { $sort: { rating: -1 } }, // Sort by highest rating
                    { $limit: 2 }, // Get top 2 meals
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            imageUrl: 1,
                            rating: 1,
                            prepTime: 1,
                            mood: 1,
                            isFavorite: { $in: ['$_id', likedRecipeIds] }
                        }
                    }
                ]) || [],
                Recipe.aggregate([
                    { $sort: { rating: -1 } }, // Sort by highest rating
                    { $limit: 2 }, // Get top 2 meals
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            imageUrl: 1,
                            rating: 1,
                            prepTime: 1,
                            isFavorite: { $in: ['$_id', likedRecipeIds] }
                        }
                    }
                ]) || [],
            ])

            httpResponse(req, res, 200, 'Related and most loved meals fetched successfully', {
                relatedMeals: relatedMeals,
                mostLovedMeals: mostLovedMeals
            })
        } catch (error) {
            next(httpError(next, error, req, 500))
        }
    },

    favoriteMeals: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId

            // Pagination and Search
            const page = parseInt(req.query.page as string) || 1
            const limit = parseInt(req.query.limit as string) || 10

            if (!userId) return next(httpError(next, 'Unauthorized', req, 401))

            const user = await User.findById(userId).select('likes').lean()

            // Convert liked recipes to a Set for quick lookup
            const likedRecipeIds = user?.likes?.map((like) => like.recipe) || []

            const totalCount = await Recipe.countDocuments({ _id: { $in: likedRecipeIds } })

            const totalPages = Math.max(1, Math.ceil(totalCount / limit))
            const validPage = Math.min(Math.max(1, page), totalPages)
            const skip = (validPage - 1) * limit

            const favoriteMealsList =
                (await Recipe.aggregate([
                    { $match: { _id: { $in: likedRecipeIds } } },
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 1,
                            imageUrl: 1,
                            name: 1,
                            prepTime: 1,
                            rating: 1,
                            isFavorite: { $in: ['$_id', likedRecipeIds] }
                        }
                    }
                ])) || []

            return httpResponse(req, res, 200, 'Favorite meals fetched successfully', {
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: totalPages
                },
                favoriteMealsList
            })
        } catch (error) {
            next(httpError(next, error, req, 500))
        }
    },

    savedFavoriteMeal: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId
            const { recipeId } = req.params
            const { isFavorite } = req.body

            if (!userId) return next(httpError(next, 'Unauthorized', req, 401))
            if (!mongoose.Types.ObjectId.isValid(recipeId)) return next(httpError(next, 'Invalid Recipe ID', req, 400))

            const update = isFavorite ? { $addToSet: { likes: { recipe: recipeId, isFavorite: true } } } : { $pull: { likes: { recipe: recipeId } } }

            const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true })
                .populate({ path: 'likes.recipe', select: 'imageUrl name prepTime rating -_id' })
                .lean()

            if (!updatedUser) return next(httpError(next, 'Failed to update user data', req, 500))

            await redisClient.del(`hero-top-meals:${userId}`)
            return httpResponse(req, res, 200, `Recipe ${isFavorite ? 'saved to' : 'removed from'} favorites successfully`, { isFavorite })
        } catch (error) {
            next(httpError(next, error, req, 500))
        }
    }
}
