// src/swagger.ts
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import { Application } from 'express'

// Swagger definition
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Mood Meal Backend API Documentation',
        version: '1.0.0',
        description: 'This is the API documentation for the Mood Meal App, providing endpoints for authentication, recipes, reviews, and more.'
    },
    servers: [
        {
            url: process.env.SERVER_URL || 'http://localhost:3000', // Fallback to localhost if env variable is not set
            description: 'Development server'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT' // Important: Specifies it’s a JWT
            }
        }
    },
    security: [{ bearerAuth: [] }] // Applies globally
}

// Options for swagger-jsdoc
const options = {
    swaggerDefinition,
    apis: ['./src/routes/*.ts', './src/routes/*/*.ts'] // Path to the API docs (e.g., JSDoc comments in route files)
}

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options)

// Function to serve Swagger UI
export const serveSwaggerDocs = (app: Application) => {
    app.use('/api/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}

export default swaggerSpec
