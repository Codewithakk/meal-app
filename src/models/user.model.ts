import mongoose, { Schema, Document } from 'mongoose'
export interface IUser extends Document {
    firstName?: string
    lastName?: string
    userName: string
    userEmail: string
    password?: string
    googleId?: string
    userProfile?: string
    gender?: string
    friends?: string[]
    dietType?: string[]
    allergies?: string[]
    dietTypes?: string[]
    moodGoal?: Schema.Types.ObjectId
    verified: boolean
    onboardingCompleted?: boolean
    onboardingStep?: number
    likes?: { recipe: string; isFavorite: boolean }[]
    saved?: string[]
    tokens?: string[]
    age?: string
    weight?: string
    height?: string
    activityLevel?: string
    notifications?: boolean
    usedCoupons?: { coupon: string; createdAt: Date }[]
}

const UserSchema: Schema = new Schema<IUser>(
    {
        firstName: { type: String, required: false },
        lastName: { type: String, required: false },
        userName: { type: String, required: false }, // Required name field (String)
        userEmail: { type: String, required: true, unique: true, sparse: true }, // Required email field (String), should be unique
        password: { type: String },
        googleId: { type: String, unique: true, sparse: true },
        userProfile: { type: String, default: '' }, // Profile picture URL (String)
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other', 'Prefer not to say'], // Optional enum to restrict valid values
            default: 'Prefer not to say' // Default value if not specified
        },
        friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
        // References to other models (diets, allergies, mood goals, and activity levels)
        dietTypes: [{ type: Schema.Types.ObjectId, ref: 'DietType', default: [] }], // DietType references
        allergies: [{ type: Schema.Types.ObjectId, ref: 'FoodAllergy', default: [] }], // FoodAllergy references
        moodGoal: { type: Schema.Types.ObjectId, ref: 'MoodGoal' }, // MoodGoal references
        // moodGoal:{ type: String},
        activityLevel: { type: Schema.Types.ObjectId, ref: 'ActivityLevel' }, // ActivityLevel reference
        likes: [
            {
                recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
                isFavorite: { type: Boolean, required: true }, // true = liked, false = unliked
                default: []
            }
        ],
        saved: [{ type: Schema.Types.ObjectId, ref: 'Recipe', default: [] }], // Recipe reference
        // Physical attributes
        age: { type: String }, // Age field (Number)
        weight: { type: String }, // Weight field (Number)
        height: { type: String }, // Height field (Number)

        // Onboarding status
        onboardingCompleted: { type: Boolean, default: false }, // Onboarding completion status (Boolean)
        verified: { type: Boolean, default: false }, // Email verification status (Boolean)
        notifications: { type: Boolean, default: true }, // Notifications status (Boolean)
        tokens: [{ type: String }],
        usedCoupons: [
            {
                coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
                createdAt: { type: Date, default: Date.now },
                default: []
            }
        ]
    },
    { timestamps: true }
)

export default mongoose.model<IUser>('User', UserSchema)
