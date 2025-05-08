import { Router } from "express";
import authController from "../../controllers/auth/auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import upload from "../../config/multerConfig";
import validateRequest from "../../middlewares/validateRequest";
import {
  registerSchema,
  resetPasswordSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  googleAuthTokenSchema,
} from "../../validations/auth.validation";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - userEmail
 *               - password
 *             properties:
 *               userName:
 *                 type: string
 *                 example: JohnDoe
 *               userEmail:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               userProfile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
router.post(
  "/signup",
  upload.single("userProfile"),
  validateRequest(registerSchema),
  authController.signup
);

/**
 * @swagger
 * /api/v1/auth/signin:
 *   post:
 *     summary: Sign in an existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userEmail
 *               - password
 *             properties:
 *               userEmail:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: User signed in successfully
 *       400:
 *         description: Invalid credentials
 */
router.post("/signin", validateRequest(loginSchema), authController.signin);


router.post("/google", validateRequest(googleAuthTokenSchema), authController.googleLogin)

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: 
 *       - Auth
 *     security:
 *       - bearerAuth: []  # 🔹 Requires Authorization Header with Bearer Token
 *     description: Logs out the currently authenticated user by removing their token from Redis.
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized - No token provided or token is invalid"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

router.post("/logout", authMiddleware, authController.logout);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request a password reset via email (OTP)
 *     tags: [Auth]
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
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: User not found
 */
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @swagger
 * /api/v1/auth/verify:
 *   post:
 *     summary: Verify OTP before resetting password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/verify", validateRequest(verifyOtpSchema), authController.verifyOtp);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset user password after OTP verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: "NewPassword@123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: OTP verification required
 */
router.post(
  "/reset-password",
  authMiddleware,
  validateRequest(resetPasswordSchema),
  authController.resetPassword
);

// router.put(
//   "/edit",
//   authController.editUserProfile
// );

router.post("/refresh-token", authController.refreshToken);

router.get("/open-app", authController.openApp);
export default router;
