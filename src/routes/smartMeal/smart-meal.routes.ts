import express from 'express'
import { addFeedback, askQuestion, getUserMessages } from '../../controllers/smartMeal/smartMeal.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import validateRequest from '../../middlewares/validateRequest'
import { SmartMealFeedBackSchema } from '../../validations/smartMeal.validation'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: SmartMeal
 *   description: API endpoints for smart meal interactions
 */

/**
 * @swagger
 * /api/v1/smart-meal-generator/ask:
 *   post:
 *     summary: Ask a smart meal question
 *     tags: [SmartMeal]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "What is the best breakfast for energy?"
 *     responses:
 *       200:
 *         description: AI Response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: "Oatmeal with fruits is a great choice for energy."
 *       400:
 *         description: Bad request - Missing question
 *       500:
 *         description: Internal server error
 */
router.post('/ask', authMiddleware, askQuestion)

/**
 * @swagger
 * /api/v1/smart-meal-generator/ask:
 *   get:
 *     summary: Get user messages
 *     tags: [SmartMeal]
 *     responses:
 *       200:
 *         description: List of user messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userPrompt:
 *                         type: string
 *                         example: "What is the best breakfast for energy?"
 *                       response:
 *                         type: string
 *                         example: "Oatmeal with fruits is a great choice for energy."
 */
router.get('/ask', authMiddleware, getUserMessages)

/**
 * @swagger
 * /api/v1/smart-meal-generator/ask/{messageId}:
 *   patch:
 *     summary: Add feedback to a message
 *     tags: [SmartMeal]
 *     parameters:
 *       - name: messageId
 *         in: path
 *         required: true
 *         description: ID of the message to add feedback to
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               feedback:
 *                 type: string
 *                 enum: [like, unlike, none]
 *                 example: "like"
 *     responses:
 *       200:
 *         description: Feedback added successfully
 *       400:
 *         description: Bad request - Invalid feedback or message ID
 */
router.patch('/ask/:messageId', authMiddleware, validateRequest(SmartMealFeedBackSchema), addFeedback)

export default router
