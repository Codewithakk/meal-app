import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware'
import {
    createSubscriptionPlan,
    deleteSubscriptionPlan,
    getSubscriptionPlanById,
    getSubscriptionPlans,
    updateSubscriptionPlan
} from '../../controllers/subscriptionPlan/subsciption.controller'
import validateRequest from '../../middlewares/validateRequest'
import { subscriptionPlanSchema } from '../../validations/subscription.validation'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Subscription
 *   description: Subscription management and retrieval for plans
 */

/**
 * @swagger
 * /subscription/plan:
 *   post:
 *     summary: Create a new subscription plan
 *     tags:
 *       - Subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - billingCycle
 *               - currency
 *               - features
 *               - isFree
 *             properties:
 *               name:
 *                 type: string
 *                 example: Premium Plan
 *               price:
 *                 type: number
 *                 example: 50.99
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 example: yearly
 *               currency:
 *                 type: string
 *                 example: USD
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Ad-Free Experience", "Personalized Meal Plans", "Weekly Mood Analysis"]
 *               isFree:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Subscription plan created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/plan', authMiddleware, validateRequest(subscriptionPlanSchema), createSubscriptionPlan)

/**
 * @swagger
 * /subscription/plan/{planId}:
 *   patch:
 *     summary: Update an existing subscription plan
 *     tags:
 *       - Subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: planId
 *         in: path
 *         required: true
 *         description: ID of the subscription plan to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Premium Plan Updated
 *               price:
 *                 type: number
 *                 example: 49.99
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 example: monthly
 *               currency:
 *                 type: string
 *                 example: USD
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Ad-Free Experience", "Personalized Meal Plans"]
 *               isFree:
 *                 type: boolean
 *                 example: false
 *
 */
router.patch('/plan/:planId', authMiddleware, validateRequest(subscriptionPlanSchema), updateSubscriptionPlan)

/**
 * @swagger
 * /subscription/plan/{planId}:
 *   delete:
 *     summary: Delete a subscription plan
 *     tags:
 *       - Subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: planId
 *         in: path
 *         required: true
 *         description: ID of the subscription plan to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription plan deleted successfully
 *       404:
 *         description: Subscription plan not found
 */
router.delete('/plan/:planId', authMiddleware, deleteSubscriptionPlan)

/**
 * @swagger
 * /subscription/plan:
 *   get:
 *     summary: Get all subscription plans
 *     tags:
 *       - Subscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subscription plans
 */
router.get('/plan', authMiddleware, getSubscriptionPlans)

/**
 * @swagger
 * /subscription/plan/{planId}:
 *   get:
 *     summary: Get a subscription plan by ID
 *     tags:
 *       - Subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: planId
 *         in: path
 *         required: true
 *         description: ID of the subscription plan to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription plan details
 *       404:
 *         description: Subscription plan not found
 */
router.get('/plan/:planId', authMiddleware, getSubscriptionPlanById)

export default router
