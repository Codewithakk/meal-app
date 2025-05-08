// src/swagger.ts
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Mood Meal Backend API Documentation',
    version: '1.0.0',
    description: 'This is the API documentation for the Mood Meal App, providing endpoints for authentication, recipes, reviews, and more.',
  },
  servers: [
    {
      url: process.env.SERVER_URL || 'http://localhost:3000', // Fallback to localhost if env variable is not set
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT", // Important: Specifies it’s a JWT
      },
    },
  },
  security: [{ bearerAuth: [] }], // Applies globally

  // tags: [
  //   { name: 'Auth', description: 'Authentication and user management' },
  //   { name: 'Home', description: 'Endpoints related to the home screen' },
  //   { name: 'Onboarding', description: 'Endpoints related to the onboarding screen' },
  //   { name: 'Meals', description: 'Meal Page APIs' },
  //   // { name: 'Recipes', description: 'Recipe management APIs' },
  //   { name: 'Reviews', description: 'User reviews management for recipes' },
  //   { name: 'SmartMeal', description: 'Smart Meal APIs' },
  //   { name: 'Community', description: 'Community APIs' },
  //   // { name: 'Common', description: 'Common APIs' },
  // ],
  // paths: {}, // This will be populated by JSDoc comments in route files
};


// Options for swagger-jsdoc
const options = {
  swaggerDefinition,
  // apis: ['./src/routes/*.ts',
  //   './src/routes/auth/*.ts',
  //   './src/routes/community/*.ts',
  //   './src/routes/home/*.ts',
  //   './src/routes/meal/*.ts',
  //   './src/routes/onboarding/*.ts',
  //   './src/routes/smartMeal/*.ts'], // Path to the API docs (e.g., JSDoc comments in route files)
  apis: ['./src/routes/*.ts', './src/routes/*/*.ts',], // Path to the API docs (e.g., JSDoc comments in route files)
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

// Function to serve Swagger UI
export const serveSwaggerDocs = (app: any) => {
  app.use('/api/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default swaggerSpec;
