import { z } from 'zod'

export const createCouponSchema = z.object({
    code: z
        .string()
        .min(1, { message: 'Code is required' })
        .transform((val) => val.trim().toUpperCase()),
    discountType: z.enum(['percentage', 'fixed']),
    discountAmount: z.number(),
    expirationDate: z.coerce.date().refine((date) => date > new Date(), { message: 'Expiration date must be in the future' }),
    usageLimit: z.number().default(1),
    usedCount: z.number().default(0),
    isActive: z.boolean().default(true)
})

export const updateCouponSchema = z.object({
    code: z.string().trim().toUpperCase().optional(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    discountAmount: z.number().optional(),
    expirationDate: z.coerce
        .date()
        .refine((date) => date > new Date(), { message: 'Expiration date must be in the future' })
        .optional(),
    usageLimit: z.number().optional(),
    usedCount: z.number().optional(),
    isActive: z.boolean().optional()
})

export const claimRewardSchema = z.object({
    userEmail: z.string().email('Invalid email format')
})
