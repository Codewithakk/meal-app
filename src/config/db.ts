import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config() // Load environment variables

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase'

// MongoDB connection
export const connectMongoDB = async () => {
    try {
        await mongoose.connect(MONGO_URI)
        console.log('✅ MongoDB Connected')
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error)
        process.exit(1) // Exit process on failure
    }
}
