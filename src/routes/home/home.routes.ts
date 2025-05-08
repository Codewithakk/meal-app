import { Router } from 'express';
import { homeController } from '../../controllers/home/home.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { createRecipe } from '../../controllers/common.controller';
import { review } from '../../controllers/review.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Home
 *   description: Home page API documentation
 */

/**
 * @swagger
 * /api/v1/home:
 *   get:
 *     summary: Fetch user info along with the top-rated meals of the day
 *     tags: [Home]
 *     security:
 *       - bearerAuth: [] # Requires JWT Token
 *     responses:
 *       200:
 *         description: User info and top-rated meals fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     userName:
 *                       type: string
 *                       example: John Doe
 *                     userProfile:
 *                       type: string
 *                       example: john_doe.jpg
 *                     moodGoal:
 *                       type: string
 *                       example: Happy
 *                 topRatedMeals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       img:
 *                         type: string
 *                         example: meal.jpg
 *                       name:
 *                         type: string
 *                         example: Spaghetti Bolognese
 *                       prepTime:
 *                         type: string
 *                         example: "30 minutes"
 *                       rating:
 *                         type: number
 *                         example: 4.5
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/", authMiddleware, homeController.heroAndTopMealOfDay);

/**
 * @swagger
 * /mood-goal:
 *   get:
 *     summary: Get mood goals for the authenticated user
 *     description: Retrieves mood goals associated with the logged-in user.
 *     tags:
 *       - Mood Goals
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Mood goals retrieved successfully.
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
 *                   example: Mood goals retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "6611f3b8c4a3e92a1b7e4c99"
 *                       userId:
 *                         type: string
 *                         example: "660d1f2a9f3b3c4b7e2d1234"
 *                       goal:
 *                         type: string
 *                         example: "Stay positive and meditate daily"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-03-20T12:45:30.000Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-03-20T14:10:45.000Z"
 *       400:
 *         description: User ID is required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User ID is required"
 *       404:
 *         description: No mood goals found for the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Moods not found"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
router.get("/user/mood-goal", authMiddleware,homeController.getUserMoodGoals);
router.post("share/:recipeId", authMiddleware,homeController.shareRecipe);

/**
 * @swagger
 * /api/v1/home/mealofday:
 *   get:
 *     summary: Fetch the top-rated meals of the day
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Top-rated meals fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get("/mealofday", authMiddleware,homeController.mealofday);

/**
 * @swagger
 * /api/v1/home/recipeDetails:
 *   get:
 *     summary: Fetch the details of a specific recipe
 *     tags: [Home]
 *     parameters:
 *       - in: query
 *         name: recipeid
 *         description: The ID of the recipe
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipe details fetched successfully
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Internal server error
 */
router.get("/recipeDetails", authMiddleware,homeController.recipeDetail);

/**
 * @swagger
 * /api/v1/home/relatedMostLoved:
 *   get:
 *     summary: Fetch related meals based on user's mood and the most loved meals
 *     tags: [Home]
 *     security:
 *       - bearerAuth: [] # Requires JWT Token
 *     responses:
 *       200:
 *         description: Related meals and most loved meals fetched successfully
 *       404:
 *         description: Mood goal not found or meals not found
 *       500:
 *         description: Internal server error
 */
router.get("/relatedMostLoved", authMiddleware, homeController.relatedMostLovedMeal);
router.get("/relatedmeals", authMiddleware, homeController.relatedMeals);
router.get("/mostLovedmeals", authMiddleware, homeController.MostLovedMeal);


// /**
//  * @swagger
//  * /api/v1/home/moodGoal:
//  *   get:
//  *     summary: Fetch a list of available mood goals
//  *     tags: [Home]
//  *     responses:
//  *       200:
//  *         description: List of mood goals fetched successfully
//  *       500:
//  *         description: Internal server error
//  */
// router.get("/moodGoal", homeController.moodGoalList);

/**
 * @swagger
 * /api/v1/home/favorite:
 *   get:
 *     summary: Fetch user's favorite meals
 *     tags: [Home]
 *     security:
 *       - bearerAuth: [] # Requires JWT Token
 *     responses:
 *       200:
 *         description: Favorite meals fetched successfully
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Internal server error
 */
router.get("/favorite", authMiddleware, homeController.favoriteMeals);
router.put("/favorite/:recipeId", authMiddleware, homeController.savedFavoriteMeal);

export default router;
