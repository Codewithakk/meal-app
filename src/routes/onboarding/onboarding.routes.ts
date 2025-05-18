import { Router } from 'express'
import { onboardingController } from '../../controllers/onboarding/onboarding.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import validateRequest from '../../middlewares/validateRequest'
import { profileDetailsSchema } from '../../validations/profileDetails.validation'
import { GetAllmoodGoals, moodGoals } from '../../controllers/streak/streak.controller'

const router = Router()
/**
 * @swagger
 * tags:
 *   name: Onboarding
 *   description: home page api documentation
 */
/**
 * @swagger
 * /onboarding/select-diet-type:
 *   post:
 *     summary: Select diet types for a user
 *     tags:
 *       - Onboarding
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dietTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - dietTypes
 *     responses:
 *       "200":
 *         description: Diet types updated successfully
 *       "400":
 *         description: User ID and at least one diet type are required
 *       "404":
 *         description: User not found
 */
router.put('/dietType', authMiddleware, onboardingController.selectDietType) // Select Diet type

/**
 * @swagger
 * /api/v1/onboarding/dietType:
 *   get:
 *     summary: Get dietary preferences for a user
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: [] # Requires JWT Token
 *     responses:
 *       200:
 *         description: Dietary preferences retrieved
 *       404:
 *         description: User not found
 */
router.get('/dietType', onboardingController.getAllDietType)

/**
 * @swagger
 * /api/v1/onboarding/allergies:
 *   put:
 *     summary: Update user's allergies
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: [] # Requires JWT Token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60c72b2f5f1b2c001c8e4d8f", "60c72b3a5f1b2c001c8e4d90"]
 *     responses:
 *       200:
 *         description: Allergies updated successfully
 *       400:
 *         description: User ID and at least one allergy are required
 *       404:
 *         description: Some allergies not found or User not found
 */
router.put('/allergies', authMiddleware, onboardingController.selectAllergies)

/**
 * @swagger
 * /allergies:
 *   get:
 *     summary: Get all allergies
 *     description: Retrieve a list of all allergies.
 *     tags: [Onboarding]
 *     responses:
 *       200:
 *         description: Successfully retrieved all allergies.
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
 *                   example: "All allergies retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "65a3bc2f2d7c2a001e5e9b3a"
 *                       name:
 *                         type: string
 *                         example: "Peanut Allergy"
 *       500:
 *         description: Internal server error.
 */

router.get('/allergies', onboardingController.getAllAllergies) // Get all Allergies

/**
 * @swagger
 * /mood-goal:
 *   get:
 *     summary: Get all mood goals
 *     description: Retrieve the mood goal of the authenticated user.
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved mood goal.
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
 *                   example: "Mood goal retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     moodGoal:
 *                       type: string
 *                       example: "Stay positive"
 *       400:
 *         description: User ID is required or invalid.
 *       401:
 *         description: Unauthorized access (missing or invalid token).
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */

router.get('/mood-goal', authMiddleware, GetAllmoodGoals)

/**
 * @swagger
 * /api/v1/onboarding/mood-goal:
 *   put:
 *     summary: Update user's mood goals
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: [] # Requires JWT Token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               moodGoal:
 *                 type: string
 *                 example: "60c72b2f5f1b2c001c8e4d8f"
 *     responses:
 *       200:
 *         description: Mood goals updated
 *       400:
 *         description: Invalid request
 */
router.put('/mood-goal/:moodGoalId', authMiddleware, moodGoals)

/**
 * @swagger
 * /api/v1/onboarding/profile-details:
 *   get:
 *     summary: Retrieve profile details for a user
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: [] # Requires JWT Token
 *     responses:
 *       200:
 *         description: User profile details retrieved
 */
router.get('/profile-details', authMiddleware, onboardingController.profileDetails)

/**
 * @swagger
 * /api/v1/onboarding/profile-details:
 *   put:
 *     summary: Update profile details for a user
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: [] # Requires JWT Token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               age:
 *                 type: number
 *                 example: 25
 *               weight:
 *                 type: number
 *                 example: 70
 *               height:
 *                 type: number
 *                 example: 175
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: User ID and at least one of age, weight, or height are required
 *       404:
 *         description: User not found
 */
router.put('/profile-details', authMiddleware, validateRequest(profileDetailsSchema), onboardingController.profileUpdate)

/**
 * @swagger
 * /api/v1/onboarding/activity-level:
 *   put:
 *     summary: Update the user's activity level
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: [] # Requires JWT Token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activitylevelid:
 *                 type: string
 *                 example: "60c72b2f5f1b2c001c8e4d8f"
 *     responses:
 *       200:
 *         description: Activity level updated successfully
 *       400:
 *         description: Invalid request data
 */
router.put('/activity-level/:activityLevelid', authMiddleware, onboardingController.activityLevel)

/**
 * @swagger
 * /api/v1/onboarding/activity-level:
 *   get:
 *     summary: Get all activity levels
 *     description: Fetches all activity levels from the database.
 *     tags: [Onboarding]
 *     responses:
 *       200:
 *         description: Successfully retrieved all activity levels.
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
 *                   example: "All Activity level"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "65a7f34b12d3a72d5c4d3f1a"
 *                       name:
 *                         type: string
 *                         example: "Moderate Exercise"
 *                       description:
 *                         type: string
 *                         example: "Exercise 3-4 times a week"
 *       404:
 *         description: Activity levels not found.
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
 *                   example: "Activity Level not found"
 *       500:
 *         description: Internal Server Error.
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
 *                   example: "Internal server error"
 */

router.get('/activity-level', onboardingController.getAllactivityLevel)

export default router
