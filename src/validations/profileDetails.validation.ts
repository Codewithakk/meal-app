import { z } from 'zod'

export const profileDetailsSchema = z.object({
    gender: z.string({ required_error: 'Gender is required' }).nonempty('Gender cannot be empty'),
    age: z.string({ required_error: 'Age is required' }).nonempty('Age cannot be empty'),
    weight: z.string({ required_error: 'Weight is required' }).nonempty('Weight cannot be empty'),
    height: z.string({ required_error: 'Height is required' }).nonempty('Height cannot be empty')
})

export const profileUpdateSchema = z.object({
    userName: z.string().min(3, 'User Name must be at least 3 characters').optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer not to say']).optional(),
    weight: z.string().optional(),
    height: z.string().optional(),
    age: z.string().optional()
})
