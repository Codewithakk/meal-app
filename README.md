#Mood-Meal-Backend


Deploy Link: 

Base URL: https://mood-meal-backend.onrender.com
Api Document: https://mood-meal-backend.onrender.com/api/v1/api-docs/#/


Project Structure Documentation

<<<<<<< HEAD

=======
>>>>>>> main
```
D:.
│   .env                      # Environment variables
│   .gitignore                # Ignore unnecessary files
│   .prettierrc               # Prettier config for formatting
│   .eslint.js                # ESLint config for linting
│   tsconfig.json             # TypeScript configuration
│   package.json              # Project dependencies
│   package-lock.json
│   README.md                 # Documentation
│   ecosystem.config.js       # PM2 process manager config
│   nodemon.json              # Nodemon config for development
│
├───dist                      # Compiled TypeScript output
│
├───logs                      # Application logs
│   ├── development.log
│   ├── error.log
│   ├── access.log
│
├───public                    # Static files (if needed)
│   ├── uploads               # For uploaded files
│   ├── images                # Static images
│   ├── .gitkeep
│
├───scripts                   # Deployment/DB migration scripts
│   ├── start.sh
│   ├── seedDatabase.ts
│
├───src
│   │   app.ts                # Main app file
│   │   server.ts             # Starts the server
│   │   swagger.ts            # API Documentation setup
│   │
│   ├───config                # Configurations (DB, Cloud, etc.)
│   │   ├── cloudinaryConfig.ts
│   │   ├── config.ts
│   │   ├── db.ts             # MongoDB connection
│   │   ├── logger.ts         # Winston/logger setup
│   │   ├── multerConfig.ts   # File upload setup
│   │   ├── rateLimiter.ts    # Rate limiting setup
│   │
│   ├───constants             # Constants used across the project
│   │   ├── application.ts
│   │   ├── responseMessage.ts
│   │
│   ├───controllers           # Controllers (Route Handlers)
│   │   ├── auth.controller.ts
│   │   ├── diet.controller.ts
│   │   ├── home.controller.ts
│   │   ├── onboarding.controller.ts
│   │   ├── review.controller.ts
│   │
│   ├───middlewares           # Express Middleware (Auth, Errors, Validation)
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.ts    # Centralized error handling
│   │   ├── rateLimit.ts
│   │   ├── validateUser.ts
│   │   ├── validateOnboarding.ts
│   │
│   ├───models                # Mongoose Models (Database Schema)
│   │   ├── ActivityLevel.model.ts
│   │   ├── DietType.model.ts
│   │   ├── FoodAllergy.model.ts
│   │   ├── MoodGoal.model.ts
│   │   ├── Recipe.model.ts
│   │   ├── User.model.ts
│   │
│   ├───routes                # Express Routes
│   │   ├── auth.routes.ts
│   │   ├── home.routes.ts
│   │   ├── model.routes.ts
│   │   ├── onboarding.routes.ts
│   │
│   ├───services              # Business logic (Reusable functions)
│   │   ├── auth.service.ts
│   │   ├── diet.service.ts
│   │   ├── email.service.ts
│   │   ├── redis.service.ts
│   │   ├── user.service.ts
│   │
│   ├───types                 # TypeScript Interfaces & Types
│   │   ├── swagger-jsdoc.d.ts
│   │   ├── index.d.ts
│   │
│   ├───utils                 # Helper functions & utilities
│   │   ├── errorObject.ts
│   │   ├── generateToken.ts
│   │   ├── httpError.ts
│   │   ├── httpResponse.ts
│   │   ├── logger.ts
│   │   ├── quicker.ts
│   │   ├── sendEmail.ts
│   │
│   ├───validations            # Joi/Zod validation schemas
│   │   ├── user.validation.ts
│   │   ├── diet.validation.ts
│   │
├───tests                      # Unit and Integration Tests
│   ├── auth.test.ts
│   ├── diet.test.ts
│
└───cache                      # Redis caching
    ├── redisClient.ts
<<<<<<< HEAD
```
=======
```

---
>>>>>>> main
"# meal-app" 
