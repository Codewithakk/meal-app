import { Router } from 'express'
import { mealsController } from '../../controllers/meal/meal.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Meals
 *   description: Meal management and retrieval for recipes
 */

/**
 * @swagger
 * /api/v1/meals:
 *   get:
 *     summary: Get all meal types
 *     tags: [Meals]
 *     description: Retrieves all meal types available, filtered by meal type, with specific fields selected (name, rating, prepTime, mood, imageUrl).
 *     parameters:
 *       - in: query
 *         name: mealType
 *         schema:
 *           type: string
 *         description: The type of meal to filter by (e.g., "Breakfast", "Lunch")
 *     responses:
 *       200:
 *         description: Meal types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Meal type found"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       rating:
 *                         type: number
 *                       prepTime:
 *                         type: number
 *                       mood:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *       500:
 *         description: Internal Server Error
 */
router.get('/', authMiddleware, mealsController.mealtype)

/**
 * @swagger
 * /api/v1/meals/saved:
 *   get:
 *     summary: Get saved meals for the authenticated user
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []  # Requires Authorization Header with Bearer Token
 *     description: Retrieves saved meals for the authenticated user.
 *     responses:
 *       200:
 *         description: Saved meals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Meal type found"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "65abcde1234567890"
 *                       userId:
 *                         type: string
 *                         example: "60a2e91e1234567890"
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Internal Server Error
 */
router.get('/saved', authMiddleware, mealsController.getSavedMeals)
router.post('/save-meal/:mealId', authMiddleware, mealsController.manageSavedMeals)
router.get('/grocery-list', authMiddleware, mealsController.groceryList)

export default router
