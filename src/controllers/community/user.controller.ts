import { Request, Response, NextFunction } from 'express'
import User from '../../models/user.model'
import httpError from '../../utils/httpError'
import httpResponse from '../../utils/httpResponse'
import mongoose from 'mongoose'
import { checkUserIsExist } from '../profile/profile.controller'

export const getUserList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId

        // Pagination and Search
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const search = ((req.query.search as string) || '').trim()

        const user = await checkUserIsExist(userId!, req, res)
        if (!user) {
            return // Exit early if user does not exist
        }

        const searchFilter: Record<string, unknown> = {
            _id: { $ne: userId }
        }

        if (search) {
            const regex = new RegExp(search, 'i') // case-insensitive search
            searchFilter.$or = [{ userName: regex }, { firstName: regex }, { lastName: regex }]
        }

        const totalCount = await User.countDocuments(searchFilter)

        const totalPages = Math.max(1, Math.ceil(totalCount / limit))
        const validPage = Math.min(Math.max(1, page), totalPages)
        const skip = (validPage - 1) * limit

        const users = await User.aggregate([
            { $match: searchFilter },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    userProfile: 1,
                    userName: 1,
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    isFriend: { $in: ['$_id', user.friends] }
                }
            }
        ])

        return httpResponse(req, res, 200, 'Users Fetched Successfully', {
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: totalPages
            },
            users
        })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const addAndRemoveFriend = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        const { friendId } = req.params

        if (!mongoose.Types.ObjectId.isValid(friendId)) {
            return httpResponse(req, res, 400, 'Invalid Firend ID')
        }

        const user = await checkUserIsExist(userId!, req, res)
        if (!user) {
            return // Exit early if user does not exist
        }

        const friendUser = await User.findById(friendId).select('-password -tokens -__v')
        if (!friendUser) {
            return httpResponse(req, res, 404, 'Friend user not found')
        }

        if (!Array.isArray(user.friends)) {
            user.friends = []
        }

        const userObjectId = new mongoose.Types.ObjectId(friendId).toString()
        const isAlreadyFriend = user.friends.includes(userObjectId)
        if (isAlreadyFriend) {
            // Remove Firend
            const friendIndex = user.friends.findIndex((c: string) => {
                return c.toString() === userObjectId
            })
            if (friendIndex === -1) {
                return httpResponse(req, res, 404, 'User not found')
            }

            // Remove friend by its its index
            user.friends.splice(friendIndex, 1)
        } else {
            // Add Firend
            user?.friends.push(userObjectId)
        }

        await user.save()
        return httpResponse(req, res, 200, isAlreadyFriend ? 'Friend removed successfully' : 'Friend added successfully', {
            totalFriends: user.friends.length || 0
        })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const getUserByFriendList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId

        // Pagination and Search
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const search = ((req.query.search as string) || '').trim()

        const userData = await checkUserIsExist(userId!, req, res)
        if (!userData) {
            return // Exit early if user does not exist
        }

        const searchFilter: Record<string, unknown> = {}
        if (search) {
            const regex = new RegExp(search, 'i') // case-insensitive search
            searchFilter.$or = [{ userName: regex }, { firstName: regex }, { lastName: regex }]
        }

        const totalCount = await User.countDocuments({
            _id: { $in: userData.friends }, // count only the friends of this user
            ...searchFilter // apply the search filter to the count query
        })

        const totalPages = Math.max(1, Math.ceil(totalCount / limit))
        const validPage = Math.min(Math.max(1, page), totalPages)
        const skip = (validPage - 1) * limit

        const userFriends = await User.find({ _id: { $in: userData.friends } })
            .find(searchFilter) // apply the search filter
            .skip(skip)
            .limit(limit)
            .select('firstName lastName userName userProfile _id')
            .exec()

        return httpResponse(req, res, 200, 'Users Fetched Successfully', {
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages
            },
            userFriends
        })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}
