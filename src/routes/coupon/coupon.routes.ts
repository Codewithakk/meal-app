import { Router } from "express";
import { authMiddleware } from '../../middlewares/auth.middleware';
import { claimReward, createCoupon, deleteCoupon, deleteManyCoupon, getCouponList, updateCoupon } from "../../controllers/coupon/coupon.controller";
import validateRequest from "../../middlewares/validateRequest";
import { createCouponSchema, updateCouponSchema, claimRewardSchema } from "../../validations/coupon.validation";

const router = Router();
/**
 * @swagger
 * tags:
 *   name: Coupon
 *   description: coupon api documentation
 */

/**
 * @swagger
 * /api/v1/coupon:
 *   post:
 *     summary: Create a new coupon
 *     tags:
 *       - Coupon
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountType
 *               - discountAmount
 *               - expirationDate
 *               - usageLimit
 *               - usedCount
 *               - isActive
 *             properties:
 *               code:
 *                 type: string
 *                 example: DISCOUNT2025
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 example: percentage
 *               discountAmount:
 *                 type: number
 *                 example: 15
 *               expirationDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-12-31T23:59:59.999Z
 *               usageLimit:
 *                 type: integer
 *                 example: 1
 *               usedCount:
 *                 type: integer
 *                 example: 0
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post("/", authMiddleware, validateRequest(createCouponSchema), createCoupon);

/**
 * @swagger
 * /api/v1/coupon/{couponId}:
 *   patch:
 *     summary: Update an existing coupon
 *     tags:
 *       - Coupon
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID to update
 *         example: 68087c00be3077e537886b91
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: DISCOUNT2025
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 example: percentage
 *               discountAmount:
 *                 type: number
 *                 example: 15
 *               expirationDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-12-31T23:59:59.999Z
 *               usageLimit:
 *                 type: integer
 *                 example: 1
 *               usedCount:
 *                 type: integer
 *                 example: 0
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Coupon not found
 */
router.patch("/:couponId", authMiddleware, validateRequest(updateCouponSchema), updateCoupon);

/**
 * @swagger
 * /api/v1/coupon/{id}:
 *   delete:
 *     summary: Delete a coupon by ID
 *     tags:
 *       - Coupon
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the coupon to delete
 *         example: 68087c00be3077e537886b91
 *     responses:
 *       200:
 *         description: Coupon deleted successfully
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
 *                   example: Coupon deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Coupon not found
 */
router.delete("/:couponId", authMiddleware, deleteCoupon);

/**
 * @swagger
 * /api/v1/coupon/delete/many:
 *   delete:
 *     summary: Delete multiple coupons by their IDs
 *     tags:
 *       - Coupon
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - couponIds
 *             properties:
 *               couponIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - 68087c00be3077e537886b91
 *                   - 68087c00be3077e537886b92
 *     responses:
 *       200:
 *         description: Coupons deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 deletedCount:
 *                   type: integer
 *                   example: 2
 *                 message:
 *                   type: string
 *                   example: 2 coupons deleted successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 */
router.delete("/delete/many", authMiddleware, deleteManyCoupon);

/**
 * @swagger
 * /api/v1/coupon/list:
 *   get:
 *     summary: Get a paginated list of coupons
 *     tags:
 *       - Coupon
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number (default is 1)
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Number of items per page (default is 10)
 *         example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search query to filter coupons by code or other fields
 *         example: DISCOUNT
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         required: false
 *         description: Sort order (asc or desc)
 *         example: asc
 *     responses:
 *       200:
 *         description: List of coupons fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 42
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     coupons:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Unauthorized
 */
router.get("/list", authMiddleware, getCouponList);

/**
 * @swagger
 * /api/v1/coupon/{couponId}/claim_reward:
 *   post:
 *     summary: Claim a reward using a coupon
 *     tags:
 *       - Coupon
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: couponId
 *         required: true
 *         description: The ID of the coupon to claim
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userEmail
 *             properties:
 *               userEmail:
 *                 type: string
 *                 format: email
 *                 example: keval.savaliya@dignizant.com
 *     responses:
 *       200:
 *         description: Reward claimed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request or invalid input
 *       401:
 *         description: Unauthorized or missing token
 *       404:
 *         description: Coupon not found
 */
router.post("/:couponId/claim_reward", authMiddleware, validateRequest(claimRewardSchema), claimReward)

export default router;