import mongoose, { Document, Schema } from 'mongoose'

export interface ICouponEntry extends Document {
    code: string
    discountType: string
    discountAmount: number
    expirationDate: Date
    usageLimit: number
    usedCount: number
    isActive: boolean
}

const CouponSchema = new Schema<ICouponEntry>(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
        discountAmount: { type: Number, required: true },
        expirationDate: { type: Date, required: true },
        usageLimit: { type: Number, default: 1 },
        usedCount: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: { createdAt: true }
    }
)

export const Coupon = mongoose.model<ICouponEntry>('Coupon', CouponSchema)
