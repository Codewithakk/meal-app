import mongoose from 'mongoose'
import { z } from 'zod'

const joinGroupSchema = z.object({
    isOwner: z.boolean().optional().default(false),
    user: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: 'Invalid user ObjectId'
    }),
    createdAt: z
        .date()
        .optional()
        .default(() => new Date())
})

export const addGroupSchema = z.object({
    title: z.string({ required_error: 'Title is required' }).nonempty('Title cannot be empty'),
    groupProfile: z.string().optional(),
    join_group: z.array(joinGroupSchema).optional()
})

export const addGroupUserSchema = z.object({
    join_group: z.array(joinGroupSchema).optional()
})

export const addGroupChallengeZodSchema = z
    .object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().min(1, 'Description is required'),
        startDate: z.coerce.date({ invalid_type_error: 'Invalid start date' }),
        endDate: z.coerce.date({ invalid_type_error: 'Invalid end date' }),
        status: z.enum(['open', 'close', 'upcoming']).default('upcoming')
    })
    .refine((data) => data.startDate <= data.endDate, {
        message: 'Start date must be before or equal to end date',
        path: ['endDate'] // Error shows up on endDate
    })

export const updateGroupChallengeZodSchema = z
    .object({
        title: z.string().min(1, 'Title is required').optional(),
        description: z.string().min(1, 'Description is required').optional(),
        startDate: z.coerce.date({ invalid_type_error: 'Invalid start date' }).optional(),
        endDate: z.coerce.date({ invalid_type_error: 'Invalid end date' }).optional(),
        status: z.enum(['open', 'close', 'upcoming']).default('upcoming')
    })
    .refine(
        (data) => {
            if (data.startDate && data.endDate) {
                return data.startDate <= data.endDate
            }
            return true // Skip validation if one of the dates is missing
        },
        {
            message: 'Start date must be before or equal to end date',
            path: ['endDate'] // Error shows up on endDate
        }
    )
