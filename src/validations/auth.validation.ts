import { z } from 'zod'

export const loginSchema = z.object({
    userEmail: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters')
})

export const googleAuthTokenSchema = z.object({
    idToken: z.string()
})

export const registerSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than or equal to 50 characters').trim(),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than or equal to 50 characters').trim(),
    userName: z
        .string()
        .min(1, 'Username is required')
        .max(30, 'Username must be less than or equal to 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .trim(),
    userEmail: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email format')
        .max(100, 'Email must be less than or equal to 100 characters')
        .trim(),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must be at least 8 characters')
        .max(20, 'Password must be less than or equal to 20 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (e.g., !, @, #, $, etc.)')
        .trim()
})

export const resetPasswordSchema = z.object({
    newPassword: z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must be at least 8 characters')
        .max(20, 'Password must be less than or equal to 20 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (e.g., !, @, #, $, etc.)')
        .trim()
})

export const forgotPasswordSchema = z.object({
    userEmail: z.string().email('Invalid email format')
})

export const verifyOtpSchema = z.object({
    otp: z.string().length(6, 'OTP must be exactly 6 digits')
})
