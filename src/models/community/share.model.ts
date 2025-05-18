import mongoose, { Schema } from 'mongoose'

const shareSchema = new Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
    },
    { timestamps: true }
)

export default mongoose.model('Share', shareSchema)
