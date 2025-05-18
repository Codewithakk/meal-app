import mongoose, { Document, Schema } from 'mongoose'

export interface Review extends Document {
    user: Schema.Types.ObjectId
    recipe: Schema.Types.ObjectId
    review?: string
    rating: number
    imgs?: string[] // URLs or paths to images
    createdAt: Date
}

const reviewSchema = new Schema<Review>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
    review: { type: String },
    rating: { type: Number, required: true, min: 0, max: 5 },
    imgs: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model<Review>('Review', reviewSchema)
