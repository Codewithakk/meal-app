import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import User from '../models/user.model'
import Recipe from '../models/recipe.model'
import Review from '../models/review.model'
import httpError from '../utils/httpError'
import httpResponse from '../utils/httpResponse'

export const review = {
    // Add a review (Optimized)
    addReview: async (req: Request, res: Response) => {
        try {
            const userId = req.user?.userId
            const { recipeId } = req.params
            const { review, rating } = req.body
            const imgs = req.files ? (req.files as Express.Multer.File[]).map((file) => file.path) : []

            // Fetch user & recipe simultaneously
            const [user, recipe] = await Promise.all([User.findById(userId).lean(), Recipe.findById(recipeId)])

            if (!user) return httpResponse(req, res, 404, 'User not found')
            if (!recipe) return httpResponse(req, res, 404, 'Recipe not found')

            const ratingValue = isNaN(parseFloat(rating)) ? null : parseFloat(rating)

            const newReview = await Review.create({
                user: userId,
                recipe: recipeId,
                review: review?.trim() || null,
                rating: ratingValue,
                imgs: imgs || []
            })

            if (newReview) {
                const id = new mongoose.Types.ObjectId(newReview._id as string)
                recipe.reviews.push(id.toString())
                await recipe.save()
            }

            return httpResponse(req, res, 201, 'Review added successfully', { review: newReview })
        } catch (error) {
            return httpResponse(req, res, 500, error instanceof Error ? error.message : 'Server error')
        }
    },

    // Get all reviews (Optimized)
    allReview: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const allReviews = await Review.find().populate('user', 'name').populate('recipe', 'title').sort({ createdAt: -1 }).lean()

            return httpResponse(req, res, 200, 'All reviews retrieved', { allReviews })
        } catch (error) {
            next(httpError(next, error instanceof Error ? error.message : 'Server error', req, 500))
        }
    },

    // Get reviews for a specific recipe
    getReviewsByRecipe: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { recipeId } = req.params
            if (!recipeId || !mongoose.Types.ObjectId.isValid(recipeId)) {
                return next(httpError(next, 'Invalid recipe ID', req, 400))
            }

            const reviews = await Review.find({ recipe: recipeId })
                .populate({ path: 'user', select: 'userName userProfile' }) // Only include userName
                .select('user review rating imgs createdAt') // Exclude recipe, __v
                .sort({ createdAt: -1 }) // Sort by latest reviews
                .lean()

            return httpResponse(req, res, 200, 'Reviews retrieved', { reviews })
        } catch (error) {
            next(httpError(next, error instanceof Error ? error.message : 'Server error', req, 500))
        }
    },

    getReviewsWithComments: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { recipeId } = req.params
            if (!recipeId || !mongoose.Types.ObjectId.isValid(recipeId)) {
                return next(httpError(next, 'Invalid recipe ID', req, 400))
            }

            const reviews = await Review.find({
                recipe: recipeId,
                review: { $exists: true, $ne: '' }, // Must have a comment (not null or empty)
                imgs: { $size: 0 } // Must NOT have images
            })
                .populate({ path: 'user', select: 'userName userProfile' })
                .select('user review rating createdAt') // Excluding imgs field
                .sort({ createdAt: -1 })
                .lean()

            const totalReviews = reviews.length

            return httpResponse(req, res, 200, 'Filtered reviews retrieved', { reviews, totalReviews })
        } catch (error) {
            next(httpError(next, error instanceof Error ? error.message : 'Server error', req, 500))
        }
    },

    getReviewsWithPhotos: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { recipeId } = req.params
            if (!recipeId || !mongoose.Types.ObjectId.isValid(recipeId)) {
                return next(httpError(next, 'Invalid recipe ID', req, 400))
            }

            const reviews = await Review.find({ recipe: recipeId, imgs: { $exists: true, $not: { $size: 0 } } }) // Only reviews with images
                .populate({ path: 'user', select: 'userName userProfile' })
                .select('user review rating imgs createdAt') // Exclude review text
                .sort({ createdAt: -1 })
                .lean()
            // Total reviews after filtering
            const totalReviews = reviews.length
            return httpResponse(req, res, 200, 'Reviews with images retrieved', { reviews, totalReviews })
        } catch (error) {
            next(httpError(next, error instanceof Error ? error.message : 'Server error', req, 500))
        }
    },

    // Get reviews by a specific user (Optimized)
    getReviewsByUser: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId
            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                return next(httpError(next, 'Invalid user ID', req, 400))
            }

            const userReviews = await Review.find({ user: userId }).populate('recipe', 'title').sort({ createdAt: -1 }).lean()

            if (!userReviews.length) {
                return next(httpError(next, 'No reviews found for this user', req, 404))
            }

            return httpResponse(req, res, 200, 'User reviews retrieved', { userReviews })
        } catch (error) {
            next(httpError(next, error instanceof Error ? error.message : 'Server error', req, 500))
        }
    },

    // Update a review (Optimized)
    updateReview: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { reviewId } = req.params
            const { review: reviewText, rating } = req.body
            const uploadedImages = req.files as Express.Multer.File[]

            // ✅ Validate reviewId early
            if (!mongoose.Types.ObjectId.isValid(reviewId)) {
                return next(httpError(next, 'Invalid review ID', req, 400))
            }

            // ✅ Find the review first to ensure it exists
            const existingReview = await Review.findById(reviewId)
            if (!existingReview) {
                return httpResponse(req, res, 404, 'Review not found')
            }

            // ✅ Update only provided fields
            if (reviewText !== undefined) existingReview.review = reviewText
            if (rating !== undefined) existingReview.rating = rating
            if (uploadedImages.length > 0) {
                existingReview.imgs = uploadedImages.map((file) => file.path)
            }

            // ✅ Save to trigger middleware and validation
            await existingReview.save()

            // ✅ Recalculate average rating only if needed
            if (rating !== undefined) {
                const ratingStats = await Review.aggregate([
                    { $match: { recipe: existingReview.recipe } },
                    { $group: { _id: null, totalRating: { $sum: '$rating' }, count: { $sum: 1 } } }
                ])

                await Recipe.findByIdAndUpdate(existingReview.recipe, {
                    rating: ratingStats.length > 0 ? ratingStats[0].totalRating / ratingStats[0].count : 0
                })
            }

            return httpResponse(req, res, 200, 'Review updated successfully', { review: existingReview })
        } catch (error) {
            next(httpError(next, error instanceof Error ? error.message : 'Server error', req, 500))
        }
    },

    deleteReview: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { reviewId } = req.params
            if (!mongoose.Types.ObjectId.isValid(reviewId)) {
                return next(httpError(next, 'Invalid review ID', req, 400))
            }

            const deletedReview = await Review.findByIdAndDelete(reviewId)
            if (!deletedReview) {
                return next(httpError(next, 'Review not found', req, 404))
            }
            const ratingStats = await Review.aggregate([
                { $match: { recipe: deletedReview.recipe } },
                { $group: { _id: null, totalRating: { $sum: '$rating' }, count: { $sum: 1 } } }
            ])

            // Update the recipe's average rating
            await Recipe.findByIdAndUpdate(deletedReview.recipe, {
                rating: ratingStats.length > 0 ? ratingStats[0].totalRating / ratingStats[0].count : 0
            })

            return httpResponse(req, res, 200, 'Review deleted successfully')
        } catch (error) {
            next(httpError(next, error instanceof Error ? error.message : 'Server error', req, 500))
        }
    }
}
