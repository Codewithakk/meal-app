import { Router } from 'express'
import {
    createDietType,
    updateDietType,
    createFoodAllergy,
    updateFoodAllergy,
    createMoodGoal,
    updateMoodGoal,
    createActivityLevel,
    updateActivityLevel,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    deleteRecipeImages
} from '../controllers/common.controller'
import upload from '../config/multerConfig'
import { authMiddleware } from '../middlewares/auth.middleware'
import validateRequest from '../middlewares/validateRequest'
import { recipeSchema } from '../validations/recipe.validation'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Common
 *   description: API endpoints for managing common entities
 */

/** ========================== Diet Type Routes ========================== **/
/**
 * @swagger
 * /diet-type:
 *   post:
 *     summary: Create a new Diet Type
 *     tags: [DietType]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/DietType'
 *     responses:
 *       201:
 *         description: Diet type created successfully
 *       400:
 *         description: Diet type already exists or missing data
 *       500:
 *         description: Internal server error
 */
router.post('/dietTypes', upload.single('img'), createDietType)

/**
 * @swagger
 * /diet-type/{id}:
 *   put:
 *     summary: Update Diet Type by ID
 *     tags: [DietType]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The DietType ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/DietType'
 *     responses:
 *       200:
 *         description: DietType updated successfully
 *       404:
 *         description: DietType not found
 *       500:
 *         description: Internal server error
 */
router.put('/dietTypes', upload.single('img'), updateDietType) // Update by ID

/** ========================== Food Allergy Routes ========================== **/

/**
 * @swagger
 * /foodallergies:
 *   post:
 *     summary: Create Food Allergy
 *     tags: [FoodAllergy]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/FoodAllergy'
 *     responses:
 *       201:
 *         description: FoodAllergy created successfully
 */
router.post('/foodallergies', upload.single('img'), createFoodAllergy) // Create

/**
 * @swagger
 * /foodallergies/{id}:
 *   put:
 *     summary: Update Food Allergy by ID
 *     tags: [FoodAllergy]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/FoodAllergy'
 *     responses:
 *       200:
 *         description: FoodAllergy updated successfully
 */
router.put('/foodallergies/:id', upload.single('img'), updateFoodAllergy) // Update by ID

/** ========================== Mood Goal Routes ========================== **/

/**
 * @swagger
 * /moodgoals:
 *   post:
 *     summary: Create Mood Goal
 *     tags: [MoodGoal]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/MoodGoal'
 *     responses:
 *       201:
 *         description: MoodGoal created successfully
 */
router.post('/moodgoals', upload.single('emoji'), createMoodGoal)

/**
 * @swagger
 * /moodgoals/{id}:
 *   put:
 *     summary: Update Mood Goal by ID
 *     tags: [MoodGoal]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/MoodGoal'
 *     responses:
 *       200:
 *         description: MoodGoal updated successfully
 */
router.put('/moodgoals/:id', upload.single('emoji'), updateMoodGoal) // Update by ID

/** ========================== Activity Level Routes ========================== **/

/**
 * @swagger
 * /activitylevels:
 *   post:
 *     summary: Create Activity Level
 *     tags: [ActivityLevel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityLevel'
 *     responses:
 *       201:
 *         description: ActivityLevel created successfully
 */
router.post('/activitylevels', createActivityLevel) // Create

/**
 * @swagger
 * /activitylevels/{id}:
 *   put:
 *     summary: Update Activity Level by ID
 *     tags: [ActivityLevel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityLevel'
 *     responses:
 *       200:
 *         description: ActivityLevel updated successfully
 */
router.put('/activitylevels/:id', updateActivityLevel) // Update by ID

/**
 * @swagger
 * /api/v1/home/createRecipe:
 *   post:
 *     summary: Create a new recipe
 *     tags: [Home]
 *     security:
 *       - bearerAuth: [] # Requires JWT Token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Pasta Primavera"
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Pasta", "Tomatoes", "Basil"]
 *               prepTime:
 *                 type: number
 *                 example: 20
 *               mood:
 *                 type: string
 *                 example: "Happy"
 *               imageUrl:
 *                 type: string
 *                 example: "pasta.jpg"
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *       400:
 *         description: Bad request (missing fields or invalid data)
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Internal server error
 */
router.post('/createRecipe', authMiddleware, upload.single('imageUrl'), validateRequest(recipeSchema), createRecipe)

router.patch('/recipe/:recipeId', authMiddleware, upload.single('imageUrl'), validateRequest(recipeSchema), updateRecipe)

router.delete('/recipe/:recipeId', authMiddleware, deleteRecipe)

router.delete('/recipe/images/:recipeId', authMiddleware, deleteRecipeImages)

export default router
