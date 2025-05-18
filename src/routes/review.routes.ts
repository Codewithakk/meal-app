import { Router } from 'express'
import { review } from '../controllers/review.controller' // ✅ Correct import
import { authMiddleware } from '../middlewares/auth.middleware'
import upload from '../config/multerConfig'

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: User reviews management for recipes
 */

const route = Router()

/**
 * @swagger
 * /api/v1/review/recipes/{recipeId}/reviews:
 *   post:
 *     summary: Add a new review for a specific recipe
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []  # Requires Authorization Header with Bearer Token
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the recipe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - review
 *               - rating
 *             properties:
 *               review:
 *                 type: string
 *                 description: The review text
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating between 1 and 5
 *               imgs:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 description: List of image URLs for the review
 *     responses:
 *       201:
 *         description: Review added successfully
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Recipe or user not found
 */
route.post('/recipes/:recipeId/reviews', upload.array('imgs', 10), authMiddleware, review.addReview)

/**
 * @swagger
 * /api/v1/review:
 *   get:
 *     summary: Get all reviews
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: A list of all reviews
 */
route.get('/', review.allReview)

/**
 * @swagger
 * /api/v1/review/recipes/{recipeId}/reviews:
 *   get:
 *     summary: Get all reviews for a specific recipe
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the recipe
 *     responses:
 *       200:
 *         description: List of reviews for the specified recipe
 *       404:
 *         description: Recipe not found
 */
route.get('/recipes/:recipeId/reviews', review.getReviewsByRecipe)
route.get('/recipes/:recipeId/reviews/comments', review.getReviewsWithComments)
route.get('/recipes/:recipeId/reviews/photos', review.getReviewsWithPhotos)

/**
 * @swagger
 * /api/v1/review/users:
 *   get:
 *     summary: Get all reviews made by a specific user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []  # Requires Authorization Header with Bearer Token
 *     responses:
 *       200:
 *         description: List of reviews by the user
 *       404:
 *         description: User not found or no reviews available
 */
route.get('/users', authMiddleware, review.getReviewsByUser)

/**
 * @swagger
 * /api/v1/review/{reviewId}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               review:
 *                 type: string
 *                 description: The updated review text
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Updated rating between 1 and 5
 *               imgs:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 description: Updated image URLs
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       404:
 *         description: Review not found
 */
route.patch('/:reviewId', upload.array('imgs'), review.updateReview)

/**
 * @swagger
 * /api/v1/review/{reviewId}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review to delete
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */
route.delete('/:reviewId', review.deleteReview)

export default route
