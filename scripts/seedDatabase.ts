import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { faker } from '@faker-js/faker'
import User, { IUser } from '../src/models/user.model'
import Recipe, { Recipe as RecipeType } from '../src/models/recipe.model'
import { DietTypeModel } from '../src/models/dietType.model'
import { FoodAllergyModel } from '../src/models/foodAllergy'
import { MoodGoalModel } from '../src/models/moodGoal'
import { ActivityLevelModel } from '../src/models/ActivityLevel.model'

dotenv.config()

async function seedDatabase() {
    try {
        await mongoose.connect(`mongodb+srv://akshaysingh:BByD9uxIevkPmcmk@project.lu19i.mongodb.net/?retryWrites=true&w=majority&appName=mood-meal`)
        console.log('🔥 Connected to MongoDB')

        // Clear previous data
        await User.deleteMany()
        await Recipe.deleteMany()
        await DietTypeModel.deleteMany()
        await FoodAllergyModel.deleteMany()
        await MoodGoalModel.deleteMany()
        await ActivityLevelModel.deleteMany()
        console.log('🧹 Cleared old data')

        // Step 1: Seed Supporting Models
        const dietTypes = await DietTypeModel.insertMany([
            { name: 'Vegan', img: faker.image.url() },
            { name: 'Keto', img: faker.image.url() },
            { name: 'Paleo', img: faker.image.url() }
        ])

        const allergies = await FoodAllergyModel.insertMany([
            { name: 'Peanuts', img: faker.image.url() },
            { name: 'Dairy', img: faker.image.url() }
        ])

        const moodGoals = await MoodGoalModel.insertMany([
            { name: 'Improve Focus', description: 'Helps you stay focused', emoji: '📖' },
            { name: 'Reduce Stress', description: 'Calm and relax', emoji: '🧘' }
        ])

        const activityLevels = await ActivityLevelModel.insertMany([
            { level: 'Sedentary', description: 'Little to no exercise' },
            { level: 'Active', description: 'Exercise 3-4 times a week' }
        ])

        console.log('✅ Seeded supporting models!')

        // Step 2: Seed Recipes
        const recipes: RecipeType[] = []
        for (let i = 0; i < 100; i++) {
            const recipe = new Recipe({
                name: faker.commerce.productName(),
                rating: faker.number.int({ min: 1, max: 5 }),
                prepTime: faker.number.int({ min: 10, max: 60 }),
                calories: faker.number.int({ min: 100, max: 900 }),
                mood: faker.helpers.arrayElement(['Comforting', 'Energizing', 'Light']),
                mealType: faker.helpers.arrayElement(['Breakfast', 'Lunch', 'Dinner']),
                nutritionalInfo: {
                    carbs: faker.number.int({ min: 10, max: 100 }),
                    protein: faker.number.int({ min: 5, max: 50 }),
                    fats: faker.number.int({ min: 5, max: 50 })
                },
                ingredients: Array.from({ length: 5 }, () => ({
                    ingredientName: faker.commerce.productMaterial()
                })),
                instructions: Array.from({ length: 5 }, (_, idx) => ({
                    step: idx + 1,
                    description1: faker.lorem.sentence(),
                    description2: faker.lorem.sentence()
                })),
                benefits: Array.from({ length: 3 }, () => ({
                    title: faker.lorem.word(),
                    description: faker.lorem.sentence()
                })),
                imageUrl: faker.image.url()
            })

            await recipe.save()
            recipes.push(recipe)
        }

        console.log('✅ Seeded recipes!')

        // Step 3: Seed Users
        const users: IUser[] = []
        for (let i = 0; i < 100; i++) {
            const user = new User({
                userName: faker.person.fullName(),
                userEmail: faker.internet.email(),
                password: faker.internet.password(),
                userProfile: faker.image.avatar(),
                gender: faker.helpers.arrayElement(['Male', 'Female', 'Other', 'Prefer not to say']),
                dietTypes: faker.helpers.arrayElements(dietTypes, { min: 1, max: 2 }).map((d) => d._id),
                allergies: faker.helpers.arrayElements(allergies, { min: 1, max: 2 }).map((a) => a._id),
                moodGoal: faker.helpers.arrayElement(moodGoals)._id,
                activityLevel: faker.helpers.arrayElement(activityLevels)._id,
                likes: faker.helpers.arrayElements(recipes, { min: 1, max: 3 }).map((r) => r._id),
                saved: faker.helpers.arrayElements(recipes, { min: 1, max: 3 }).map((r) => r._id),
                age: faker.number.int({ min: 18, max: 60 }),
                weight: faker.number.int({ min: 50, max: 100 }),
                height: faker.number.int({ min: 150, max: 200 }),
                onboardingCompleted: faker.datatype.boolean(),
                verified: faker.datatype.boolean(),
                notifications: faker.datatype.boolean()
            })

            await user.save()
            users.push(user)
        }

        console.log('✅ Seeded users!')

        mongoose.connection.close()
    } catch (error) {
        console.error('❌ Seeding failed:', error)
        mongoose.connection.close()
    }
}

seedDatabase()
