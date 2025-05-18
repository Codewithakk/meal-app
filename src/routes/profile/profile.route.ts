import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware'
import upload from '../../config/multerConfig'
import { changePassword, editUserProfile, getUserProfile, toggleNotification } from '../../controllers/profile/profile.controller'
import { updateInfo, getInfo, createInfo } from '../../controllers/info.controller'
import validateRequest from '../../middlewares/validateRequest'
import { profileUpdateSchema } from '../../validations/profileDetails.validation'

const router = Router()

/**
 * @swagger
 * /api/v1/profile:
 *   patch:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile including image upload.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *                 example: johndoe
 *               userProfile:
 *                 type: string
 *                 format: binary
 *               age:
 *                 type: integer
 *                 example: 25
 *               height:
 *                 type: string
 *                 example: "170 cm"
 *               weight:
 *                 type: number
 *                 example: 70
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     userName:
 *                       type: string
 *                     age:
 *                       type: string
 *                     height:
 *                       type: string
 *                     weight:
 *                       type: string
 *                     gender:
 *                       type: string
 *                     profileImage:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Bad request – Missing or invalid fields
 *       401:
 *         description: Unauthorized – Invalid or missing token
 */
router.patch('/', authMiddleware, validateRequest(profileUpdateSchema), upload.single('userProfile'), editUserProfile)

/**
 * @swagger
 * /api/v1/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the profile of the authenticated user.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response with user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   example: 67f645dcfb6ae2c7ab02192c
 *                 name:
 *                   type: string
 *                   example: John Doe
 *                 email:
 *                   type: string
 *                   example: john@example.com
 *       401:
 *         description: Unauthorized – Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/', authMiddleware, getUserProfile)

router.put('/change-password', authMiddleware, changePassword)
router.put('/toggle-notification', authMiddleware, toggleNotification)
router.get('/info/:type', getInfo)
router.post('/info/:type', upload.single('img'), authMiddleware, createInfo)
router.put('/info/:type', updateInfo)

export default router
