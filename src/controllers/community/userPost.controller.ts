import { Request, Response, NextFunction } from 'express'
import Post from '../../models/community/userPost.model'
import shareModel from '../../models/community/share.model'
import redisClient from '../../cache/redisClient'
import httpError from '../../utils/httpError'
import httpResponse from '../../utils/httpResponse'
import mongoose from 'mongoose'
import { checkUserIsExist } from '../profile/profile.controller'
import { deleteImages } from '../../utils/deleteImage'
import { checkGroupIsExist } from './group.controller'
import { Group } from '../../models/group.model'
import { GroupChallenge } from '../../models/groupChallenge.model'
import { IComment } from '../../interfaces/post'

export const createPost = async (req: Request, res: Response, next: NextFunction) => {
    const images = req.files ? (req.files as Express.Multer.File[]).map((file) => file.path) : []
    const userId = req.user?.userId
    const { groupId } = req.params
    const { title, about, description, hashtags } = req.body

    try {
        if (!userId) {
            next(httpError(next, 'Unauthorized', req, 401))
        }

        const groupExist = await checkGroupIsExist(groupId!, req, res)
        if (!groupExist) {
            return // Exit early if group does not exist
        }

        const groupUserExist = await Group.findOne({ _id: groupId, 'join_group.user': userId })
        if (!groupUserExist) {
            return httpResponse(req, res, 403, 'User is not part of any group')
        }

        const newPost = new Post({
            user: userId,
            group: groupId,
            title,
            description,
            about,
            images,
            hashtags
        })

        await newPost.save()
        httpResponse(req, res, 201, 'Post Created Successfully')
    } catch (error) {
        return next(httpError(next, error, req, 500))
    }
}

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
    const images = req.files ? (req.files as Express.Multer.File[]).map((file) => file.path) : []
    const userId = req.user?.userId
    const { postId } = req.params
    const { title, about, description, hashtags } = req.body

    const user = await checkUserIsExist(userId!, req, res)
    if (!user) {
        return // Exit early if user does not exist
    }

    // Find the post
    const post = await Post.findById(postId)
    if (!post) {
        return httpResponse(req, res, 404, 'Post not found')
    }

    if (post.user.toString() !== userId) {
        return httpResponse(req, res, 404, 'You are not the author of this post')
    }

    try {
        Post.updateOne(
            { _id: postId },
            {
                $set: {
                    title: title,
                    description: description,
                    about: about,
                    images: images,
                    hashtags: hashtags
                }
            }
        )

        httpResponse(req, res, 200, 'Post Updated Successfully')
    } catch (error) {
        return next(httpError(next, error, req, 500))
    }
}

export const deletePostImage = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId
    const { postId } = req.params
    const { imageList } = req.body

    try {
        const user = await checkUserIsExist(userId!, req, res)
        if (!user) {
            return // Exit early if user does not exist
        }

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            res.status(400).json({ message: 'Invalid Post ID' })
        }

        // Find the post
        const post = await Post.findById(postId)
        if (!post) {
            return httpResponse(req, res, 404, 'Post not found')
        }

        if (post.user.toString() !== userId) {
            return httpResponse(req, res, 404, 'You are not the author of this post')
        }

        if (imageList && imageList.length > 0) {
            const imageNames = imageList
                .map((image: string) => {
                    const match = image.match(/upload\/(?:v\d+\/)?(.+?)\.[^\/]+$/)
                    return match ? match[1] : null // Return the image name if matched, or null if no match
                })
                .filter((name: string) => name !== null) // Remove null values (non-matching records)

            if (imageNames.length > 0) {
                const imagesToDelete = post.images.filter((imageUrl: string) => imageNames.some((imageName: string) => imageUrl.includes(imageName)))

                // Remove images from post.images that match the image names
                post.images = post.images.filter((imageUrl: string) => {
                    return !imageNames.some((imageName: string) => imageUrl.includes(imageName))
                })

                if (imagesToDelete.length > 0) {
                    await deleteImages(imageNames) // you could also pass imagesToDelete if needed
                    await post.save() // Save updated post
                    httpResponse(req, res, 200, 'Post Image Deleted Successfully')
                }
            } else {
                return httpResponse(req, res, 200, 'No matching images found to delete.')
            }
        } else {
            return httpResponse(req, res, 400, 'No images provided for deletion.')
        }
    } catch (error) {
        return next(httpError(next, error, req, 500))
    }
}

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId
    const { postId } = req.params
    try {
        const user = await checkUserIsExist(userId!, req, res)
        if (!user) {
            return // Exit early if user does not exist
        }

        // Find the post
        const post = await Post.findOne({ _id: postId })
        if (!post) {
            return httpResponse(req, res, 404, 'Post not found')
        }

        if (post.user.toString() !== userId) {
            return httpResponse(req, res, 404, 'You are not the author of this post')
        }

        if (post?.images.length > 0) {
            const imageNames = post?.images
                .map((image: string) => {
                    const match = image.match(/upload\/(?:v\d+\/)?(.+?)\.[^\/]+$/)
                    return match ? match[1] : null // Return the image name if matched, or null if no match
                })
                .filter((name): name is string => name !== null)

            if (imageNames.length > 0) {
                await deleteImages(imageNames)
            }
        }

        await Post.deleteOne({ _id: post._id })

        httpResponse(req, res, 200, 'Post Deleted Successfully')
    } catch (error) {
        return next(httpError(next, error, req, 500))
    }
}

export const getPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId

        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const search = ((req.query.search as string) || '').trim()

        const user = await checkUserIsExist(userId!, req, res)
        if (!user) {
            return // Exit early if user does not exist
        }

        const groups = await Group.find({ 'join_group.user': userId }).select('_id')
        if (!groups.length) {
            return httpResponse(req, res, 403, 'User is not part of any group')
        }

        const groupIds = groups.map((group) => group._id)

        const searchRegex = new RegExp(search, 'i') // case-insensitive
        const searchFilter = {
            group: { $in: groupIds },
            $or: [
                { title: { $regex: searchRegex } },
                { description: { $regex: searchRegex } },
                { about: { $regex: searchRegex } },
                { hashtags: { $in: [searchRegex] } }
            ]
        }

        const totalCount = await Post.countDocuments(searchFilter)

        const totalPages = Math.max(1, Math.ceil(totalCount / limit))
        const validPage = Math.min(Math.max(1, page), totalPages)
        const skip = (validPage - 1) * limit

        const postsList = await Post.aggregate([
            { $match: searchFilter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $lookup: {
                    from: 'groups',
                    localField: 'group',
                    foreignField: '_id',
                    as: 'group'
                }
            },
            { $unwind: '$user' },
            { $unwind: '$group' },
            {
                $addFields: {
                    likesCount: { $size: { $ifNull: ['$likes', 0] } },
                    dislikesCount: { $size: { $ifNull: ['$dislikes', 0] } },
                    commentCount: { $size: { $ifNull: ['$comments', 0] } }
                }
            },
            {
                $project: {
                    images: 1,
                    title: 1,
                    description: 1,
                    about: 1,
                    hashtags: 1,
                    likesCount: 1,
                    dislikesCount: 1,
                    commentCount: 1,
                    sharesCount: 1,
                    viewcount: 1,
                    'user.userProfile': 1,
                    'user.userName': 1,
                    'group.title': 1,
                    'group.groupProfile': 1,
                    'group._id': 1
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) }
        ]).exec()

        httpResponse(req, res, 200, 'Posts Fetched Successfully', {
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages
            },
            postsList
        })
    } catch (error) {
        return next(httpError(next, error, req, 500))
    }
}

export const sharePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params
    const userId = req.user?.userId
    try {
        // Check if the user already shared this post
        const alreadyShared = await shareModel.findOne({ user: userId, post: postId })
        if (alreadyShared) {
            res.status(400).json({ message: 'You already shared this post' })
            httpResponse(req, res, 201, 'Post Shared Successfully')
        }

        // Create Share Entry
        const share = new shareModel({ user: userId, post: postId })
        await share.save()

        // Increment the share count in Post
        await Post.findByIdAndUpdate(postId, { $inc: { shares: 1 } })
        httpResponse(req, res, 201, 'Post Created Successfully')

        res.status(200).json({ message: 'Post shared successfully', share })
    } catch (error) {
        return next(httpError(next, error, req, 500))
    }
}

export const viewPost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params
    const userId = req.user?.userId

    if (!userId) {
        return next(httpError(next, 'Unauthorized', req, 401))
    }

    try {
        const redisKey = `post:${postId}:views`

        // Check if user already viewed
        const isViewed = await redisClient.sIsMember(redisKey, userId as string)
        if (isViewed) {
            return httpResponse(req, res, 200, 'Already viewed', { status: false })
        }

        // Add user to Redis Set
        await redisClient.sAdd(redisKey, userId as string)
        await redisClient.expire(redisKey, 600) // 10 mins expiration

        // Increment view count
        await Post.findByIdAndUpdate(postId, { $inc: { viewcount: 1 } })

        return httpResponse(req, res, 200, 'Post viewed successfully')
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const feed = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId

        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const search = ((req.query.search as string) || '').trim()

        const user = await checkUserIsExist(userId!, req, res)
        if (!user) {
            return // Exit early if user does not exist
        }

        const searchRegex = new RegExp(search, 'i') // case-insensitive
        const searchFilter = {
            $or: [
                { user: { $in: user?.friends } },
                { title: { $regex: searchRegex } },
                { description: { $regex: searchRegex } },
                { about: { $regex: searchRegex } },
                { hashtags: { $in: [searchRegex] } }
            ]
        }

        const totalCount = await Post.countDocuments(searchFilter)

        const totalPages = Math.max(1, Math.ceil(totalCount / limit))
        const validPage = Math.min(Math.max(1, page), totalPages)
        const skip = (validPage - 1) * limit

        const postsList = await Post.aggregate([
            { $match: searchFilter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $lookup: {
                    from: 'groups',
                    localField: 'group',
                    foreignField: '_id',
                    as: 'group'
                }
            },
            { $unwind: '$user' },
            { $unwind: '$group' },
            {
                $addFields: {
                    likesCount: { $size: { $ifNull: ['$likes', 0] } },
                    dislikesCount: { $size: { $ifNull: ['$dislikes', 0] } },
                    commentCount: { $size: { $ifNull: ['$comments', 0] } }
                }
            },
            {
                $project: {
                    images: 1,
                    title: 1,
                    description: 1,
                    about: 1,
                    hashtags: 1,
                    likesCount: 1,
                    dislikesCount: 1,
                    commentCount: 1,
                    sharesCount: 1,
                    viewcount: 1,
                    'user.userProfile': 1,
                    'user.userName': 1,
                    'group.title': 1,
                    'group.groupProfile': 1,
                    'group._id': 1
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) }
        ]).exec()

        httpResponse(req, res, 200, 'Posts Fetched Successfully', {
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages
            },
            postsList
        })
    } catch (error) {
        return next(httpError(next, error, req, 500))
    }
}

export const likePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        const { postId } = req.params

        const user = await checkUserIsExist(userId!, req, res)
        if (!user) {
            return // Exit early if user does not exist
        }

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return httpResponse(req, res, 400, 'Invalid Post ID')
        }

        const post = await Post.findById(postId)
        if (!post) {
            return httpResponse(req, res, 404, 'Post not found')
        }

        const userObjectId = new mongoose.Types.ObjectId(userId).toString()

        // Check if the user has already liked the post
        if (post.likes.map((id) => id.toString()).includes(userObjectId)) {
            // If the user has already liked, remove the like
            const likeIndex = post.likes.findIndex((c) => {
                return c.toString() === userObjectId
            })
            if (likeIndex === -1) {
                return httpResponse(req, res, 404, 'Like not found')
            }

            // Remove the like by its index
            post.likes.splice(likeIndex, 1)
        } else {
            // Check if the user has already disliked the post
            if (post.dislikes.map((id) => id.toString()).includes(userObjectId)) {
                // If the user has already disliked, remove the like
                const disLikeIndex = post.dislikes.findIndex((c) => {
                    return c.toString() === userObjectId
                })
                if (disLikeIndex === 0) {

                    // Remove the dislike by its index
                    post.dislikes.splice(disLikeIndex, 1)
                }
            }

            // If the user has not liked, add the like
            post.likes.push(userObjectId)
        }

        if (post) {
            await post.save()
        }
        res.status(200).json({ message: 'Like updated successfully', likes: post?.likes.length })
    } catch (error) {
        next(error)
    }
}

export const dislikePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId
        const { postId } = req.params

        const user = await checkUserIsExist(userId!, req, res)
        if (!user) {
            return // Exit early if user does not exist
        }

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return httpResponse(req, res, 400, 'Invalid Post ID')
        }

        const post = await Post.findById(postId)
        if (!post) {
            return httpResponse(req, res, 404, 'Post not found')
        }

        const userObjectId = new mongoose.Types.ObjectId(userId).toString()

        // Check if the user has already disliked the post
        if (post.dislikes.includes(userObjectId)) {
            // If the user has already disliked, remove the like
            const disLikeIndex = post.dislikes.findIndex((c) => {
                return c.toString() === userObjectId
            })
            if (disLikeIndex === -1) {
                return httpResponse(req, res, 404, 'DisLike not found')
            }

            // Remove the dislike by its index
            post.dislikes.splice(disLikeIndex, 1)
        } else {
            if (post.likes.includes(userObjectId)) {
                // If the user has already liked, remove the like
                const likeIndex = post.likes.findIndex((c) => {
                    return c.toString() === userObjectId
                })
                if (likeIndex === 0) {

                    // Remove the like by its index
                    post.likes.splice(likeIndex, 1)
                }
            }

            // If the user has not disliked, add the like
            post.dislikes.push(userObjectId)
        }

        if (post) {
            await post.save()
        }
        res.status(200).json({ message: 'Dislike updated successfully', dislikes: post?.dislikes.length })
    } catch (error) {
        next(error)
    }
}

export const addComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        const { postId } = req.params
        const { commentText } = req.body

        const user = await checkUserIsExist(userId!, req, res)
        if (!user) {
            return // Exit early if user does not exist
        }

        // Validate Post ID
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return httpResponse(req, res, 400, 'Invalid Post ID')
        }

        // Find the post
        const post = await Post.findById(postId)
        if (!post) {
            return httpResponse(req, res, 404, 'Post not found')
        }

        // Add comment to the post
        post.comments.push({
            text: commentText,
            user: new mongoose.Types.ObjectId(userId),
            createdAt: new Date()
        } as unknown as IComment) // or as IComment, depending on what IComment expects

        await post.save()

        res.status(201).json({
            message: 'Comment added successfully',
            commentsCount: post.comments.length
        })
    } catch (error) {
        return next(httpError(next, error, req, 500))
    }
}

export const updateComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        const { postId, commentId } = req.params
        const { commentText } = req.body

        const user = await checkUserIsExist(userId!, req, res)
        if (!user) {
            return // Exit early if user does not exist
        }

        if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) {
            return httpResponse(req, res, 400, 'Invalid Post ID or Comment ID')
        }

        const post = await Post.findById(postId)
        if (!post) {
            return httpResponse(req, res, 404, 'Post not found')
        }

        const comment = post.comments.find((c) => (c._id as mongoose.Types.ObjectId).toString() === commentId)
        if (!comment) {
            return httpResponse(req, res, 404, 'Comment not found')
        }

        if (comment.user.toString() !== userId) {
            return httpResponse(req, res, 403, 'Unauthorized to update this comment')
        }

        comment.text = commentText

        await post.save()

        res.status(200).json({
            message: 'Comment updated successfully',
            commentsCount: post.comments.length
        })
    } catch (error) {
        return next(httpError(next, error, req, 500))
    }
}

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        const { postId, commentId } = req.params

        const user = await checkUserIsExist(userId!, req, res)
        if (!user) return

        if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) {
            return httpResponse(req, res, 400, 'Invalid Post ID or Comment ID')
        }

        const post = await Post.findById(postId)
        if (!post) {
            return httpResponse(req, res, 404, 'Post not found')
        }

        const commentIndex = post.comments.findIndex((c) => (c._id as mongoose.Types.ObjectId).toString() === commentId)
        if (commentIndex === -1) {
            return httpResponse(req, res, 404, 'Comment not found')
        }

        const comment = post.comments[commentIndex]

        // Check if the current user is the comment owner
        if (comment.user.toString() !== userId) {
            return httpResponse(req, res, 403, 'Unauthorized to delete this comment')
        }

        // Remove the comment by its index
        post.comments.splice(commentIndex, 1)

        // Save the post with the comment removed
        await post.save()

        res.status(200).json({
            message: 'Comment deleted successfully',
            commentsCount: post.comments.length
        })
    } catch (error) {
        return next(httpError(next, error, req, 500))
    }
}

export const getCommentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        const { postId, commentId } = req.params

        const user = await checkUserIsExist(userId!, req, res)
        if (!user) return

        if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) {
            return httpResponse(req, res, 400, 'Invalid Post ID or Comment ID')
        }

        const post = await Post.findById(postId)
        if (!post) {
            return httpResponse(req, res, 404, 'Post not found')
        }

        const comment = post.comments.find((c) => (c._id as mongoose.Types.ObjectId).toString() === commentId)
        if (!comment) {
            return httpResponse(req, res, 404, 'Comment not found')
        }

        // Check if the current user is the comment owner
        if (comment.user.toString() !== userId) {
            return httpResponse(req, res, 403, 'Unauthorized to delete this comment')
        }

        res.status(200).json({
            message: 'Comment retrieved successfully',
            comment: comment
        })
    } catch (error) {
        return next(httpError(next, error, req, 500))
    }
}

export const getCommentCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { postId } = req.params

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            res.status(400).json({ message: 'Invalid Post ID' })
        }

        const post = await Post.findById(postId)
        if (!post) res.status(404).json({ message: 'Post not found' })

        res.status(200).json({ message: 'Comment count retrieved', commentsCount: post?.comments.length })
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

export const getLinkCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { postId } = req.params

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            res.status(400).json({ message: 'Invalid Post ID' })
        }

        const post = await Post.findById(postId)
        if (!post) res.status(404).json({ message: 'Post not found' })

        res.status(200).json({ message: 'Likes count retrieved', commentsCount: post?.likes.length })
    } catch (error) {
        return next(httpError(next, error, req, 500))
    }
}

export const getDisLikeCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { postId } = req.params

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            res.status(400).json({ message: 'Invalid Post ID' })
        }

        const post = await Post.findById(postId)
        if (!post) res.status(404).json({ message: 'Post not found' })

        res.status(200).json({ message: 'Dislike count retrieved', commentsCount: post?.dislikes.length })
    } catch (error) {
        return next(httpError(next, error, req, 500))
    }
}

export const createPostForChallenge = async (req: Request, res: Response, next: NextFunction) => {
    const images = req.files ? (req.files as Express.Multer.File[]).map((file) => file.path) : []
    const userId = req.user?.userId
    const { groupId, groupchallengeId } = req.params
    const { title, about, description, hashtags } = req.body

    try {
        if (!userId) {
            next(httpError(next, 'Unauthorized', req, 401))
        }

        const groupExist = await checkGroupIsExist(groupId!, req, res)
        if (!groupExist) {
            return // Exit early if group does not exist
        }

        const groupUserExist = await Group.findOne({ _id: groupId, 'join_group.user': userId })
        if (!groupUserExist) {
            return httpResponse(req, res, 403, 'User is not part of any group')
        }

        const groupChallenge = await GroupChallenge.findOne({ _id: groupchallengeId, group: groupId })
        if (!groupChallenge) {
            return httpResponse(req, res, 404, 'Group challenge not found')
        }

        if (groupChallenge.status !== 'open') {
            return httpResponse(req, res, 403, 'Group challenge is not currently open')
        }

        const isUserInChallenge = groupChallenge.join_challenge.includes(new mongoose.Types.ObjectId(userId))
        if (!isUserInChallenge) {
            return httpResponse(req, res, 403, 'User is not part of the group challenge')
        }

        const newPost = new Post({
            user: userId,
            group: groupId,
            groupchallengeId,
            title,
            description,
            about,
            images,
            hashtags
        })

        await newPost.save()
        httpResponse(req, res, 201, 'Challenge Post Created Successfully')
    } catch (error) {
        return next(httpError(next, error, req, 500))
    }
}

export const getChallengePosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        const { groupId } = req.params

        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const search = ((req.query.search as string) || '').trim()

        const user = await checkUserIsExist(userId!, req, res)
        if (!user) {
            return // Exit early if user does not exist
        }

        const groupChallengeList = await GroupChallenge.find({ group: groupId, join_challenge: userId })
        if (!groupChallengeList.length) {
            return httpResponse(req, res, 403, 'User is not part of any challenge group')
        }

        const challengeIds = groupChallengeList.map((challenge) => challenge._id)

        const searchRegex = new RegExp(search, 'i') // case-insensitive
        const searchFilter = {
            groupchallengeId: { $in: challengeIds },
            $or: [
                { title: { $regex: searchRegex } },
                { description: { $regex: searchRegex } },
                { about: { $regex: searchRegex } },
                { hashtags: { $in: [searchRegex] } }
            ]
        }

        const totalCount = await Post.countDocuments(searchFilter)

        const totalPages = Math.max(1, Math.ceil(totalCount / limit))
        const validPage = Math.min(Math.max(1, page), totalPages)
        const skip = (validPage - 1) * limit

        const postsList = await Post.aggregate([
            { $match: searchFilter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $lookup: {
                    from: 'groupchallenges',
                    localField: 'groupchallengeId',
                    foreignField: '_id',
                    as: 'groupchallenge'
                }
            },
            { $unwind: '$user' },
            { $unwind: '$groupchallenge' },
            {
                $addFields: {
                    likesCount: { $size: { $ifNull: ['$likes', 0] } },
                    dislikesCount: { $size: { $ifNull: ['$dislikes', 0] } },
                    commentCount: { $size: { $ifNull: ['$comments', 0] } }
                }
            },
            {
                $project: {
                    images: 1,
                    title: 1,
                    description: 1,
                    about: 1,
                    hashtags: 1,
                    likesCount: 1,
                    dislikesCount: 1,
                    commentCount: 1,
                    sharesCount: 1,
                    viewcount: 1,
                    'user.userProfile': 1,
                    'user.userName': 1,
                    'groupchallenge.title': 1,
                    'groupchallenge.description': 1,
                    'groupchallenge.challengeImage': 1,
                    'groupchallenge.startDate': 1,
                    'groupchallenge.endDate': 1,
                    'groupchallenge.status': 1,
                    'groupchallenge._id': 1
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) }
        ]).exec()

        httpResponse(req, res, 200, 'Challenge Posts Fetched Successfully', {
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages
            },
            postsList
        })
    } catch (error) {
        return next(httpError(next, error, req, 500))
    }
}
