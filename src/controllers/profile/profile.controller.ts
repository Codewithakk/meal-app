import { Request, Response, NextFunction } from 'express'
import User from '../../models/user.model' // Adjust path as needed
import httpResponse from '../../utils/httpResponse'
import httpError from '../../utils/httpError'
import bcrypt from 'bcryptjs'
import { deleteImages } from '../../utils/deleteImage'

export const checkUserIsExist = async (userId: string, req: Request, res: Response) => {
    const user = await User.findById(userId).select('-password -tokens -__v')
    if (!user) {
        return httpResponse(req, res, 404, 'User not found')
    }
    return user
}

export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId // Extract userId from the request

        const user = await User.findById(userId)
            .select('-password -tokens -__v')
            .populate('friends')
            .populate('dietTypes')
            .populate('allergies')
            .populate('moodGoal')
            .populate('activityLevel')
            .populate('likes.recipe')
            .populate('saved')
            .populate('usedCoupons.coupon')

        if (!user) {
            return httpResponse(req, res, 404, 'User not found')
        }

        return httpResponse(req, res, 200, 'User profile retrieved successfully', { user })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

// Edit User Profile
export const editUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId
        const { userName, gender, weight, height, age } = req.body
        const userProfile = req.file ? req.file.path : undefined // Use `undefined` instead of null for optional fields

        if (userProfile) {
            const userData = await checkUserIsExist(userId!, req, res)
            if (!userData) {
                return // Exit early if user does not exist
            }

            if (userData) {
                const match = userData?.userProfile?.match(/upload\/(?:v\d+\/)?(.+?)\.[^\/]+$/)
                const imageName = match ? match[1] : ''
                if (imageName != '') {
                    await deleteImages([imageName]);
                }
            }
        }

        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { userName, gender, age, weight, height, ...(userProfile && { userProfile }) } },
            { new: true }
        ).select('-password -tokens -__v')

        if (!updatedUser) {
            return httpResponse(req, res, 404, 'User not found')
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        })
    } catch (error) {
        return next(error) // Ensure next(error) is properly handled in error middleware
    }
}

export const profileUpdate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        const { userName, userEmail } = req.body

        if (!userId) {
            return httpResponse(req, res, 401, 'Unauthorized: User ID is missing')
        }

        // Validate input: at least one field should be present
        if (userName === undefined && userEmail === undefined) {
            return httpResponse(req, res, 400, 'At least one field (userName or userEmail) must be provided')
        }

        const updateFields: Partial<{ userName: string; userEmail: string }> = {}

        if (userName !== undefined) {
            const trimmedName = String(userName).trim()
            if (trimmedName.length === 0) {
                return httpResponse(req, res, 400, 'Invalid userName: Cannot be empty')
            }
            updateFields.userName = trimmedName
        }

        if (userEmail !== undefined) {
            const trimmedEmail = String(userEmail).trim()
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(trimmedEmail)) {
                return httpResponse(req, res, 400, 'Invalid email format')
            }
            updateFields.userEmail = trimmedEmail
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateFields }, { new: true }).select('userName userEmail')

        if (!updatedUser) {
            return httpResponse(req, res, 404, 'User not found')
        }

        return httpResponse(req, res, 200, 'Profile updated successfully', { user: updatedUser })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        const { oldPassword, newPassword } = req.body

        if (!userId) {
            return httpResponse(req, res, 401, 'Unauthorized: User ID is missing')
        }

        if (!oldPassword || !newPassword) {
            return httpResponse(req, res, 400, 'Old and new passwords are required')
        }

        const user = await User.findById(userId).select('password')
        if (!user || !user.password) {
            return httpResponse(req, res, 404, 'User not found or password not set')
        }
        console.log(user.password, 'user password')
        console.log(user, 'password')

        const isMatch = await bcrypt.compare(oldPassword, user.password)
        if (!isMatch) {
            return httpResponse(req, res, 400, 'Incorrect old password')
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, await bcrypt.genSalt(10))
        user.password = hashedNewPassword
        await user.save()

        return httpResponse(req, res, 200, 'Password changed successfully')
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const toggleNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId
        const { notifications } = req.body

        if (!userId) {
            return httpResponse(req, res, 401, 'Unauthorized: User ID is missing')
        }

        if (typeof notifications !== 'boolean') {
            return httpResponse(req, res, 400, "Invalid input: 'notifications' must be a boolean")
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { notifications }, { new: true }).select('notifications')

        if (!updatedUser) {
            return httpResponse(req, res, 404, 'User not found')
        }

        return httpResponse(req, res, 200, 'Notification preference updated successfully', {
            notifications: updatedUser.notifications
        })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}
