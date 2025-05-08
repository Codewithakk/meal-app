import { NextFunction, Request, Response } from "express";
import User from "../../models/user.model";
import mongoose from "mongoose";
import httpResponse from "../../utils/httpResponse";
import httpError from "../../utils/httpError";
import { MoodGoalModel } from "../../models/moodGoal";
import { StreakMood } from "../../models/streakMood.model";
import { io } from "../../app";
import redisClient from "../../cache/redisClient";
import { checkUserIsExist } from '../profile/profile.controller';


export const sendReminderNotification = async (id: string, message: string) => {
    io.to('user_' + id.toString()).emit("receive_notification", { message });
    await redisClient.setEx(`reminderNotification:${id}`, 604800, id.toString());
}

export const cronJonStreakByUser = async (now: Date) => {
    try {
        const message = `One small mood update today keeps the streak alive! 😊`

        const userList = await User.find()
        if (userList.length > 0) {
            for (let i = 0; i < userList.length; i++) {
                const data = userList[i] as typeof User.prototype;
                const streakDoc = await StreakMood.findOne({ userId: data._id })
                if (streakDoc) {
                    const latest = streakDoc.moodGoal.at(-1);
                    if (latest?.createdAt) {
                        const diffHours = Math.abs(now.getTime() - latest.createdAt.getTime()) / 36e5;

                        const redisToken = await redisClient.get(`reminderNotification:${streakDoc.userId}`);
                        if (!redisToken && diffHours >= 24 && diffHours < 30) {
                            // Missed a full day (over 24h since last)
                            await sendReminderNotification(streakDoc.userId.toString(), message)
                        }

                        if (diffHours >= 30) {
                            // Missed a full day (over 30h since last)
                            streakDoc.moodGoal = []; // Reset streak
                        }
                    }
                } else {
                    const redisToken = await redisClient.get(`reminderNotification:${data._id}`);
                    if (!redisToken) {
                        // Missed a full day (over 24h since last)
                        await sendReminderNotification(data._id, message)
                    }
                }
            }
        }
    } catch (error) {
        console.log(" Streak Cron Error:- ", error);
    }
}

export const moodGoals = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { moodGoalId } = req.params;
        const now = new Date();

        if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(moodGoalId)) {
            return httpResponse(req, res, 400, "Invalid User ID or Mood Goal ID format");
        }

        let streakDoc = await StreakMood.findOne({ userId })

        const user = await User.findByIdAndUpdate(userId,
            { moodGoal: moodGoalId },
            { new: true }
        ).select("moodGoal").lean();

        if (!user) {
            return httpResponse(req, res, 404, "User not found");
        }

        if (!streakDoc) {
            streakDoc = await StreakMood.create({
                userId,
                moodGoal: [{ mood: new mongoose.Types.ObjectId(moodGoalId), createdAt: now }],
            });
            await redisClient.del(`reminderNotification:${userId}`);
            return httpResponse(req, res, 200, "Mood goal updated successfully", { moodGoal: user.moodGoal })
        }

        const latest = streakDoc.moodGoal[streakDoc.moodGoal.length - 1];

        if (latest) {
            const diffHours = latest?.createdAt ? Math.abs(now.getTime() - latest.createdAt.getTime()) / 36e5 : 0;

            const nowDay = now.toISOString().split('T')[0];
            const latestDay = latest?.createdAt?.toISOString().split('T')[0] ?? '';

            // If same calendar day OR within 24 hours
            if (nowDay === latestDay || diffHours < 24) {
                // return httpResponse(req, res, 409, "Mood already submitted today.", { moodGoal: user.moodGoal })
                return httpResponse(req, res, 200, "Mood goal updated successfully", { moodGoal: user.moodGoal })
            }
        }

        if (streakDoc) {
            streakDoc.moodGoal?.push({
                mood: new mongoose.Types.ObjectId(moodGoalId),
                createdAt: new Date(),
            } as any)

            await streakDoc.save();
        }

        await redisClient.del(`reminderNotification:${userId}`);
        return httpResponse(req, res, 200, "Mood goal updated successfully", { moodGoal: user.moodGoal })

    } catch (error) {
        return httpError(next, error, req, 500);
    }
}

export const GetAllmoodGoals = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return httpResponse(req, res, 400, "User ID is required");

        const user = await User.findById(userId)
            .populate({
                path: "moodGoal",
                model: "MoodGoal",
                select: "_id name emoji"
            })
            .select("moodGoal likes")
            .lean();

        const allMoods = await MoodGoalModel
            .find({}, { _id: 1, name: 1, emoji: 1 })
            .lean();

        if (!allMoods) return httpResponse(req, res, 404, "Moods not found");

        return httpResponse(req, res, 200, "Mood goals and user likes retrieved successfully", {
            allMoods,
            userMoods: user?.moodGoal || null,
        });

    } catch (error) {
        return httpError(next, error, req, 500);
    }
}

export const getUserWaysStreakList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const userExist = await checkUserIsExist(userId!, req, res);
        if (!userExist) {
            return; // Exit early if user does not exist
        }

        const totalCount = await User.countDocuments();

        const totalPages = Math.max(1, Math.ceil(totalCount / limit));;
        const validPage = Math.min(Math.max(1, page), totalPages);
        const skip = (validPage - 1) * limit;

        const userList = await User.aggregate([
            {
                $lookup: {
                    from: 'streakmoods',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'streakMoodData'
                }
            },
            {
                $addFields: {
                    moodCount: {
                        $sum: {
                            $map: {
                                input: '$streakMoodData',
                                as: 'entry',
                                in: { $size: { $ifNull: ['$$entry.moodGoal', []] } }
                            }
                        }
                    }
                }
            },
            {
                $setWindowFields: {
                    sortBy: { moodCount: -1 },
                    output: {
                        maxMoodCount: { $max: '$moodCount' }
                    }
                }
            },
            {
                $addFields: {
                    rankScore: {
                        $cond: [
                            { $gt: ['$maxMoodCount', 0] },
                            {
                                $multiply: [
                                    { $divide: ['$moodCount', '$maxMoodCount'] },
                                    100
                                ]
                            },
                            0
                        ]
                    }
                }
            },
            {
                $setWindowFields: {
                    sortBy: { rankScore: -1 },
                    output: {
                        position: { $documentNumber: {} },
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    userName: 1,
                    userProfile: 1,
                    position: 1,
                    moodCount: 1,
                    isFriend: { $in: ['$_id', userExist?.friends] }
                }
            },
            // { $sort: { rankScore: -1 } },
            { $skip: skip },
            { $limit: Number(limit) }
        ]);

        httpResponse(req, res, 200, "User mood streak fetched successfully", {
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages
            },
            userList
        });

    } catch (error) {
        return httpError(next, error, req, 500);
    }
}

export const getUserFriendsStreakList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const userExist = await checkUserIsExist(userId!, req, res);
        if (!userExist) {
            return; // Exit early if user does not exist
        }

        const totalCount = await User.countDocuments();

        const totalPages = Math.max(1, Math.ceil(totalCount / limit));;
        const validPage = Math.min(Math.max(1, page), totalPages);
        const skip = (validPage - 1) * limit;

        const userList = await User.aggregate([
            {
                $lookup: {
                    from: 'streakmoods',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'streakMoodData'
                }
            },
            {
                $addFields: {
                    moodCount: {
                        $sum: {
                            $map: {
                                input: '$streakMoodData',
                                as: 'entry',
                                in: { $size: { $ifNull: ['$$entry.moodGoal', []] } }
                            }
                        }
                    }
                }
            },
            {
                $setWindowFields: {
                    sortBy: { moodCount: -1 },
                    output: {
                        maxMoodCount: { $max: '$moodCount' }
                    }
                }
            },
            {
                $addFields: {
                    rankScore: {
                        $cond: [
                            { $gt: ['$maxMoodCount', 0] },
                            {
                                $multiply: [
                                    { $divide: ['$moodCount', '$maxMoodCount'] },
                                    100
                                ]
                            },
                            0
                        ]
                    }
                }
            },
            {
                $setWindowFields: {
                    sortBy: { rankScore: -1 },
                    output: {
                        position: { $documentNumber: {} },
                        rank: { $rank: {} }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    userName: 1,
                    userProfile: 1,
                    position: 1,
                    moodCount: 1,
                    isFriend: { $in: ['$_id', userExist?.friends] },
                    rank: 1
                }
            },
            {
                $group: {
                    _id: "$rank",
                    users: { $push: "$$ROOT" }
                }
            },
            {
                $unwind: "$users"
            },
            {
                $replaceRoot: { newRoot: "$users" }
            },
            {
                $match: {
                    _id: { $in: userExist.friends }
                }
            },
            { $skip: skip },
            { $limit: Number(limit) }
        ]);

        httpResponse(req, res, 200, "User friend mood streak fetched successfully", {
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages
            },
            userList
        });

    } catch (error) {
        return httpError(next, error, req, 500);
    }
}

export const getUserStreakRate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;

        const userExist = await checkUserIsExist(userId!, req, res);
        if (!userExist) {
            return; // Exit early if user does not exist 
        }

        const userData = await StreakMood.findOne({ userId: userId });

        httpResponse(req, res, 200, "User mood streak fetched successfully", {
            moodCount: userData ? userData.moodGoal.length : 0
        })

    } catch (error) {
        return httpError(next, error, req, 500);
    }
}