import { z } from 'zod'

export const addCommentSchema = z.object({
    commentText: z.string({ required_error: 'Comment is required' }).nonempty('Comment cannot be empty')
})

export const addPostSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'description is required').optional(),
    about: z.string().min(1, 'about is required').optional(),
    hashtags: z.string().optional()
})
