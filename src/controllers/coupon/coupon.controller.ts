import { NextFunction, Request, Response } from 'express'
import httpResponse from '../../utils/httpResponse'
import httpError from '../../utils/httpError'
import { Coupon } from '../../models/coupon.model'
import { checkUserIsExist } from '../profile/profile.controller'
import sendEmail from '../../utils/sendEmail'

export const checkCouponExist = async (couponId: string, req: Request, res: Response) => {
    const couponExist = await Coupon.findById(couponId)
    if (!couponExist) {
        return httpResponse(req, res, 404, 'Coupon not found.')
    }
    return couponExist
}

export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        const { code, discountType, discountAmount, expirationDate, usageLimit, usedCount, isActive } = req.body

        const userExist = await checkUserIsExist(userId!, req, res)
        if (!userExist) {
            return // Exit early if user does not exist
        }

        const couponExist = await Coupon.findOne({ code })
        if (couponExist) {
            return httpResponse(req, res, 400, 'Coupon code already exists.')
        }

        const coupon = await Coupon.create({
            code,
            discountType,
            discountAmount,
            expirationDate,
            usageLimit,
            usedCount,
            isActive
        })

        return httpResponse(req, res, 201, 'Coupon created successfully.', { coupon })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        const { couponId } = req.params
        const { code, discountType, discountAmount, expirationDate, usageLimit, usedCount, isActive } = req.body

        const userExist = await checkUserIsExist(userId!, req, res)
        if (!userExist) {
            return // Exit early if user does not exist
        }

        const couponExist = await checkCouponExist(couponId!, req, res)
        if (!couponExist) {
            return
        }

        await Coupon.updateOne(
            { _id: couponId },
            {
                $set: {
                    code,
                    discountType,
                    discountAmount,
                    expirationDate,
                    usageLimit,
                    usedCount,
                    isActive
                }
            }
        )

        return httpResponse(req, res, 200, 'Coupon updated successfully.')
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        const { couponId } = req.params

        const userExist = await checkUserIsExist(userId!, req, res)
        if (!userExist) {
            return // Exit early if user does not exist
        }

        const couponExist = await checkCouponExist(couponId!, req, res)
        if (!couponExist) {
            return
        }

        await Coupon.deleteOne({ _id: couponId })

        return httpResponse(req, res, 200, 'Coupon deleted successfully.')
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const deleteManyCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        const { couponIds } = req.body

        const userExist = await checkUserIsExist(userId!, req, res)
        if (!userExist) {
            return // Exit early if user does not exist
        }

        await Coupon.deleteMany({ _id: { $in: couponIds } })

        return httpResponse(req, res, 200, 'Coupons deleted successfully.')
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const getCouponList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId

        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const search = ((req.query.search as string) || '').trim()
        const sort = ((req.query.sort as string) || '').trim()

        const userExist = await checkUserIsExist(userId!, req, res)
        if (!userExist) {
            return
        }

        const searchFilter: { $or: Record<string, unknown>[] } = { $or: [] }
        if (search) {
            const regex = new RegExp(search, 'i') // case-insensitive search
            searchFilter.$or = [{ code: regex }, { discountType: regex }]

            const parsedNumber = Number(search)
            if (!isNaN(parsedNumber)) {
                searchFilter.$or.push({ discountAmount: parsedNumber }, { usageLimit: parsedNumber }, { usedCount: parsedNumber })
            }

            if (search.toLowerCase() === 'true' || search.toLowerCase() === 'false') {
                searchFilter.$or.push({ isActive: search.toLowerCase() === 'true' })
            }
        }

        const totalCount = await Coupon.countDocuments(searchFilter)

        const totalPages = Math.max(1, Math.ceil(totalCount / limit))
        const validPage = Math.min(Math.max(1, page), totalPages)
        const skip = (validPage - 1) * limit

        const usedCouponIds = userExist?.usedCoupons ? userExist?.usedCoupons.map((c) => c.coupon) : []

        const couponList = await Coupon.aggregate([
            { $match: searchFilter },
            { $sort: { createdAt: sort === 'asc' ? 1 : sort === 'desc' ? -1 : -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    code: 1,
                    discountType: 1,
                    discountAmount: 1,
                    expirationDate: 1,
                    usageLimit: 1,
                    usedCount: 1,
                    isActive: 1,
                    isUsed: { $in: ['$_id', usedCouponIds] },
                    createdAt: 1
                }
            }
        ])

        return httpResponse(req, res, 200, 'Coupon Fetched Successfully', {
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: totalPages
            },
            couponList
        })
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}

export const claimReward = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId
        const { couponId } = req.params
        const { userEmail } = req.body

        const userExist = await checkUserIsExist(userId!, req, res)
        if (!userExist) {
            return
        }

        const couponExist = await checkCouponExist(couponId!, req, res)
        if (!couponExist) {
            return
        }

        if (userExist.usedCoupons && userExist?.usedCoupons.find((coupon: { coupon: string }) => coupon.coupon.toString() === couponId)) {
            return httpResponse(req, res, 400, 'Coupon already used.')
        }

        if (couponExist.expirationDate < new Date()) {
            return httpResponse(req, res, 400, 'Coupon expired.')
        }

        if (couponExist.isActive === false) {
            return httpResponse(req, res, 400, 'Coupon is not active.')
        }

        await Coupon.updateOne({ _id: couponId }, { $set: { usedCount: couponExist.usedCount + 1 } })

        const fullName = `${userExist.get('firstName')} ${userExist.get('lastName') || ''}`.trim()

        await userExist.updateOne({ $push: { usedCoupons: { coupon: couponId } } })

        // Coupon Template
        const couponTemplate = `
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; text-align: center;">
                <div style="max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #2ecc71; margin-bottom: 20px; font-size: 24px; font-weight: 600;">🎉 Your Exclusive Coupon Inside!</h2>

                    <p style="font-size: 16px; color: #333;">Hi <strong style="color: #2ecc71;">${fullName}</strong>,</p>
                    <p style="font-size: 16px; color: #333; line-height: 1.5;">We appreciate your support! Here's a special reward to make your next meal even better:</p>

                    <!-- Coupon Code Box -->
                    <div style="margin: 20px auto; padding: 20px; background-color: #eafaf1; color: #27ae60; font-weight: bold; font-size: 24px; border: 2px dashed #2ecc71; border-radius: 8px; width: fit-content;">
                        ${couponExist.code}
                    </div>

                    <!-- Discount Badge Section -->
                    <div style="margin: 10px auto 25px; padding: 15px 20px; background-color: #fff4e5; border-left: 6px solid #f39c12; display: inline-block; text-align: left; border-radius: 8px;">
                        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #e67e22;">
                            🎁 ${couponExist.discountType === 'percentage' ? `${couponExist.discountAmount}% OFF` : `$${couponExist.discountAmount} OFF`}
                        </p>
                        <p style="margin: 4px 0 0; font-size: 14px; color: #555;">
                            Valid until: <strong>${new Date(couponExist.expirationDate).toLocaleDateString()}</strong>
                        </p>
                    </div>

                    <p style="font-size: 16px; color: #555;">Use this code at checkout and enjoy your discount on your next Mood Meal order!</p>

                    <p style="font-size: 14px; color: #888; margin-top: 25px;">If you didn’t request this, feel free to ignore this email.</p>

                    <br>
                    <p style="font-size: 14px; color: #777;">Bon appétit!<br><strong>The Mood Meal Team</strong></p>
                </div>
            </body>
        </html>`

        await sendEmail(userEmail, '🎉 You have claimed your reward!', couponTemplate)

        return httpResponse(req, res, 200, 'Coupon claimed successfully.')
    } catch (error) {
        return httpError(next, error, req, 500)
    }
}
