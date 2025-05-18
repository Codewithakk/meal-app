import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { getUserFriendsStreakList, getUserStreakRate, getUserWaysStreakList } from '../../controllers/streak/streak.controller'

const router = Router()
/**
 * @swagger
 * tags:
 *   name: Mood Streak
 *   description: mood streak api documentation
 */

/**
 * @swagger
 * /api/v1/mood/mood-streak/list:
 *   get:
 *     summary: Get list of mood streaks
 *     tags: [Mood]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Optional search term
 *     responses:
 *       200:
 *         description: List of mood streaks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2024-04-01"
 *                       mood:
 *                         type: string
 *                         example: "happy"
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/mood-streak/list', authMiddleware, getUserWaysStreakList)

/**
 * @swagger
 * /api/v1/mood/mood-streak/friends/list:
 *   get:
 *     summary: Get list of mood streaks for friends
 *     tags: [Mood]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Optional search term to filter friends
 *     responses:
 *       200:
 *         description: Successfully retrieved friends' mood streaks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       friendName:
 *                         type: string
 *                         example: "Jane Doe"
 *                       streakCount:
 *                         type: integer
 *                         example: 15
 *                       lastMood:
 *                         type: string
 *                         example: "excited"
 *                       lastUpdated:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-04-22T10:00:00Z"
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/mood-streak/friends/list', authMiddleware, getUserFriendsStreakList)

/**
 * @swagger
 * /api/v1/mood/steak/user:
 *   get:
 *     summary: Get steak mood data for a user
 *     tags: [Mood]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mood data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mood:
 *                   type: string
 *                   example: happy
 *       401:
 *         description: Unauthorized
 */
router.get('/steak/user', authMiddleware, getUserStreakRate)

export default router
