import { Request, Response, NextFunction } from 'express'
import Post from '../../models/community/userPost.model'
import httpResponse from '../../utils/httpResponse'
import httpError from '../../utils/httpError'

export const feed = async (_: Request, res: Response, next: NextFunction) => {
    try {
        const posts = await Post.find()
            .populate({
                path: 'user',
                select: 'userProfile userName -_id' // Only userProfile and userName, excluding _id
            })
            .sort({ createdAt: -1, viewcount: -1 })
            .select('images about likes dislikes shares viewcount comments ')
            .lean()
        // Add comment count to each post
        const postsWithCommentsCount = posts.map((post) => ({
            ...post,
            commentsCount: post.comments?.length || 0 // Count comments length
        }))
        httpResponse(_, res, 200, 'Posts Fetched Successfully', postsWithCommentsCount)
    } catch (error) {
        next(httpError(next, error, _, 500))
    }
}
