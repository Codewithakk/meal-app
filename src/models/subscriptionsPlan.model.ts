import mongoose, { Document, Schema } from 'mongoose'

export interface ISubscriptionPlan extends Document {
    name: string
    price: number
    billingCycle: 'monthly' | 'yearly'
    currency: string
    features: string[]
    isFree: boolean
    createdAt: Date
    updatedAt?: Date
}

const SubscriptionPlanSchema: Schema = new Schema<ISubscriptionPlan>({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    features: [
        {
            type: String
        }
    ],
    isFree: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: () => new Date()
    },
    updatedAt: {
        type: Date
    }
})

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema)
