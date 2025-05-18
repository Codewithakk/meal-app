import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

/**
 * ✅ Generic validation middleware for any request body
 * @param schema - Zod schema to validate request body
 */
const validateRequest = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body)

        if (!result.success) {
            const formattedErrors = result.error.flatten()
            res.status(400).json({
                success: false,
                errors: formattedErrors.fieldErrors // Cleaner error response
            }) // ✅ Properly closed JSON response
            return; // Explicitly return undefined to match the void return type
        }

        next() // ✅ Proceed only if validation is successful
    }
}

export default validateRequest
