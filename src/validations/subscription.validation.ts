import { z } from 'zod';

export const subscriptionPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  price: z.number().min(0, 'Price must be a positive number'),
  billingCycle: z.enum(['monthly', 'yearly']),
  currency: z.string().optional().default('USD'),
  features: z.array(z.string().min(1, 'Feature cannot be empty')),
  isFree: z.boolean().optional().default(false),
}).refine(data => data.isFree ? data.price === 0 : true, {
  message: 'Free plans must have a price of 0',
  path: ['price']
});
