import { z } from 'zod'

export const SmartMealFeedBackSchema = z.object({
    feedback: z.enum(['like', 'unlike', 'none'], { required_error: 'Feedback type is required' })
})
