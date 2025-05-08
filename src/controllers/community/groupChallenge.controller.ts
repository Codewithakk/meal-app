import { Request, Response, NextFunction } from 'express';
import httpError from '../../utils/httpError';
import httpResponse from '../../utils/httpResponse';
import { checkUserIsExist } from '../profile/profile.controller';
import { GroupChallenge } from '../../models/groupChallenge.model';
import Post from '../../models/community/userPost.model';
import { deleteImages } from '../../utils/deleteImage';
import { checkGroupIsExist } from './group.controller';
import mongoose from 'mongoose';
import User from '../../models/user.model';
import { sendNotificationToUser } from '../notification/notification.controller';

export const checkGroupChallengeIsExist = async (groupchallengeId: string, req: Request, res: Response) => {
    const groupChallenge = await GroupChallenge.findById(groupchallengeId);
    if (!groupChallenge) {
        return httpResponse(req, res, 404, "Group challenge not found.");
    }
    return groupChallenge
}

export const createGroupChallenge = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { groupId } = req.params
        const { title, status, endDate, startDate, description } = req.body
        const challengeImage = req.file ? req.file.path : null;

        const userExist = await checkUserIsExist(userId!, req, res);
        if (!userExist) {
            return; // Exit early if user does not exist
        }

        const groupExist = await checkGroupIsExist(groupId!, req, res);
        if (!groupExist) {
            return; // Exit early if group does not exist
        }

        const isOwner = groupExist.join_group.some((member) => member.user.toString() === userId && member.isOwner);
        if (!isOwner) {
            return httpResponse(req, res, 403, "Unauthorized to create a group challenge.");
        }

        // Create group
        const groupChallenge = new GroupChallenge({
            title, challengeImage, status, endDate, startDate, description,
            group: groupId,
        });

        await groupChallenge.save();

        return httpResponse(req, res, 201, "Group challenge created successfully.", { groupChallenge });
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const updateGroupChallenge = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { groupId, groupchallengeId } = req.params;
        const { title, status, endDate, startDate, description } = req.body
        const challengeImage = req.file ? req.file.path : null;

        const userExist = await checkUserIsExist(userId!, req, res);
        if (!userExist) {
            return; // Exit early if user does not exist
        }

        const groupExist = await checkGroupIsExist(groupId!, req, res);
        if (!groupExist) {
            return; // Exit early if group does not exist
        }

        const isOwner = groupExist.join_group.some((member) => member.user.toString() === userId && member.isOwner);
        if (!isOwner) {
            return httpResponse(req, res, 403, "Unauthorized to update a group challenge.");
        }

        const groupChallengeExist = await checkGroupChallengeIsExist(groupchallengeId!, req, res);
        if (!groupChallengeExist) {
            return; // Exit early if group chellenge does not exist
        }

        await GroupChallenge.updateOne({
            _id: groupchallengeId,
        }, {
            $set: {
                title, challengeImage, status, endDate, startDate, description,
            }
        })

        return httpResponse(req, res, 200, "Group challenge updated successfully.");
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const deleteGroupChallenge = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { groupId, groupchallengeId } = req.params;

        const userExist = await checkUserIsExist(userId!, req, res);
        if (!userExist) {
            return; // Exit early if user does not exist
        }

        const groupExist = await checkGroupIsExist(groupId!, req, res);
        if (!groupExist) {
            return; // Exit early if group does not exist
        }

        const isOwner = groupExist.join_group.some((member) => member.user.toString() === userId && member.isOwner);
        if (!isOwner) {
            return httpResponse(req, res, 403, "Unauthorized to delete a group challenge.");
        }

        const groupChallengeExist = await checkGroupChallengeIsExist(groupchallengeId!, req, res);
        if (!groupChallengeExist) {
            return; // Exit early if group chellenge does not exist
        }

        if (groupChallengeExist && groupChallengeExist?.challengeImage) {
            const match = groupChallengeExist?.challengeImage?.match(/upload\/(?:v\d+\/)?(.+?)\.[^\/]+$/);
            const imageName = match ? match[1] : ''
            imageName != '' ? await deleteImages([imageName]) : ""
        }

        const postsList = await Post.find({ group: groupId, groupchallengeId: groupchallengeId })
        postsList.map(async (post) => {
            if (post?.images.length > 0) {
                const imageNames = post?.images.map((image: string) => {
                    const match = image.match(/upload\/(?:v\d+\/)?(.+?)\.[^\/]+$/);
                    return match ? match[1] : null; // Return the image name if matched, or null if no match
                }).filter((name): name is string => name !== null);

                if (imageNames.length > 0) {
                    await deleteImages(imageNames);
                }
            }

            await Post.deleteOne({ _id: post._id, group: groupId, groupchallengeId: groupchallengeId });
        })

        await GroupChallenge.deleteOne({ _id: groupchallengeId });

        return httpResponse(req, res, 200, "Group challenge deleted successfully.");
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const getGroupChallengeList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { groupId } = req.params;

        const userExist = await checkUserIsExist(userId!, req, res);
        if (!userExist) {
            return; // Exit early if user does not exist
        }

        const groupExist = await checkGroupIsExist(groupId!, req, res);
        if (!groupExist) {
            return; // Exit early if group does not exist
        }

        const isOwner = groupExist.join_group.some((member) => member.user.toString() === userId);
        if (!isOwner) {
            return httpResponse(req, res, 403, "You are not part of this group.");
        }

        const groupChallengeList = await GroupChallenge.aggregate([
            { $match: { group: new mongoose.Types.ObjectId(groupId) } },
            {
                $addFields: {
                    memberCount: { $size: { $ifNull: ['$join_challenge', 0] } },
                    isJoined: {
                        $in: [
                            new mongoose.Types.ObjectId(userId), {
                                $map: {
                                    input: '$join_challenge',
                                    as: 'jg',
                                    in: '$$jg'
                                }
                            }
                        ]
                    }
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    challengeImage: 1,
                    startDate: 1,
                    endDate: 1,
                    status: 1,
                    memberCount: 1,
                    isJoined: 1,
                    createdAt: 1,
                    updatedAt: 1,
                }
            }
        ]);

        return httpResponse(req, res, 200, "Group challenge fetched successfully.", { groupChallengeList });
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const joinAndLeftGroupChallenge = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { groupId, groupchallengeId } = req.params;

        const userExist = await checkUserIsExist(userId!, req, res);
        if (!userExist) {
            return; // Exit early if user does not exist
        }

        const groupExist = await checkGroupIsExist(groupId!, req, res);
        if (!groupExist) {
            return; // Exit early if group does not exist
        }

        const isOwner = groupExist.join_group.some((member) => member.user.toString() === userId);
        if (!isOwner) {
            return httpResponse(req, res, 403, "You are not part of this group.");
        }

        const groupChallengeExist = await checkGroupChallengeIsExist(groupchallengeId!, req, res);
        if (!groupChallengeExist) {
            return; // Exit early if group chellenge does not exist
        }

        if (groupChallengeExist.status !== 'open') {
            return httpResponse(req, res, 403, "Group challenge is not currently open");
        }


        if (!Array.isArray(groupChallengeExist.join_challenge)) {
            groupChallengeExist.join_challenge = [];
        }

        const userObjectId = new mongoose.Types.ObjectId(userId) as any;
        const userIndex = groupChallengeExist.join_challenge.findIndex(join => join.toString() === userId);
        if (userIndex !== -1) {
            // User already in group, so remove
            groupChallengeExist.join_challenge.splice(userIndex, 1);
            await groupChallengeExist.save();
            return httpResponse(req, res, 200, "Group challenge leave successfully.");
        } else {
            groupChallengeExist.join_challenge.push(userObjectId);
            await groupChallengeExist.save();
            return httpResponse(req, res, 200, "Group challenge joined successfully.");
        }
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const getGroupChallengeByJoinList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { groupId, groupchallengeId } = req.params;

        // Pagination and Search
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const userExist = await checkUserIsExist(userId!, req, res);
        if (!userExist) {
            return; // Exit early if user does not exist
        }

        const groupExist = await checkGroupIsExist(groupId!, req, res);
        if (!groupExist) {
            return; // Exit early if group does not exist
        }

        const isOwner = groupExist.join_group.some((member) => member.user.toString() === userId && member.isOwner);
        if (!isOwner) {
            return httpResponse(req, res, 403, "You are not part of this group.");
        }

        const groupChallengeExist = await checkGroupChallengeIsExist(groupchallengeId!, req, res);
        if (!groupChallengeExist) {
            return; // Exit early if group chellenge does not exist
        }

        const searchFilter: any = {
            'group': new mongoose.Types.ObjectId(groupId),
            'join_challenge': new mongoose.Types.ObjectId(userId)
        };

        const totalCount = await GroupChallenge.countDocuments(searchFilter)

        const totalPages = Math.max(1, Math.ceil(totalCount / limit));;
        const validPage = Math.min(Math.max(1, page), totalPages);
        const skip = (validPage - 1) * limit;

        const groupChallengeList = await GroupChallenge.aggregate([
            { $match: searchFilter },
            {
                $addFields: {
                    memberCount: { $size: '$join_challenge' }
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    challengeImage: 1,
                    startDate: 1,
                    endDate: 1,
                    status: 1,
                    memberCount: 1,
                    createdAt: 1,
                    updatedAt: 1,
                }
            }
        ]);

        return httpResponse(req, res, 200, "Group challenge fetched successfully", {
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages
            },
            groupChallengeList
        });
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const getGroupChallengeUserList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { groupchallengeId } = req.params;

        // Pagination and Search
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string || '').trim();

        const userExist = await checkUserIsExist(userId!, req, res);
        if (!userExist) {
            return; // Exit early if user does not exist
        }

        const groupChallengeExist = await checkGroupChallengeIsExist(groupchallengeId!, req, res);
        if (!groupChallengeExist) {
            return; // Exit early if group chellenge does not exist
        }

        const searchFilter: any = {
            _id: new mongoose.Types.ObjectId(groupchallengeId)
        };

        const regex = search ? new RegExp(search, 'i') : null;

        const totalCount = await GroupChallenge.countDocuments(searchFilter);

        const totalPages = Math.max(1, Math.ceil(totalCount / limit));;
        const validPage = Math.min(Math.max(1, page), totalPages);
        const skip = (validPage - 1) * limit;

        const groupChallegeWithCount = await GroupChallenge.aggregate([
            { $match: searchFilter },
            // Add member count and check if current user is part of join_challenge
            {
                $addFields: {
                    isJoined: { $in: [new mongoose.Types.ObjectId(userId), "$join_challenge"] },
                    memberCount: { $size: { $ifNull: ["$join_challenge", []] } }
                }
            },
            // Only include challenges where the user is part of it
            {
                $match: { isJoined: true }
            },
            // Lookup all joined members' basic details
            {
                $lookup: {
                    from: "users",
                    let: { memberIds: "$join_challenge" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: ["$_id", "$$memberIds"] },
                                ...(regex && {
                                    $or: [
                                        { firstName: { $regex: regex, $options: "i" } },
                                        { lastName: { $regex: regex, $options: "i" } }
                                    ]
                                })
                            }
                        },
                        {
                            $project: {
                                firstName: 1,
                                lastName: 1,
                                userName: 1,
                                userProfile: 1,
                                isFriend: { $in: ['$_id', userExist?.friends] }
                            }
                        }
                    ],
                    as: "memberDetails"
                }
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    challengeImage: 1,
                    startDate: 1,
                    endDate: 1,
                    status: 1,
                    createdAt: 1,
                    memberCount: 1,
                    memberDetails: 1
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        return httpResponse(req, res, 200, "Groups Fetched Successfully", {
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages
            },
            groupChallegeWithCount
        });

    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

//CronJon
export const cronJonChallengeOpenAndClose = async (now: Date) => {
    try {
        // Set to 'upcoming' if now < startDate
        await GroupChallenge.updateMany(
            {
                startDate: { $gt: now },
                status: { $ne: 'upcoming' }
            },
            {
                $set: { status: 'upcoming', updatedAt: now }
            }
        );

        await GroupChallenge.updateMany(
            {
                startDate: { $lte: now },
                endDate: { $gt: now },
                status: 'upcoming'
            },
            {
                $set: { status: 'open', updatedAt: now }
            }
        );

        // Set to 'close' if now >= endDate
        const result = await GroupChallenge.findOneAndUpdate(
            {
                endDate: { $lte: now },
                status: 'open'
            },
            {
                $set: { status: 'close', updatedAt: now }
            },
            { new: true } // Return the updated document
        );

        if (result && result.status === 'close') {
            const id = typeof result?._id === 'string' ? result._id : result?._id?.toString();

            //Fetch Top 3 User and send wining notification
            await challengeWinnerUserAnnouncement(id!, 0, 3, `congratulation you have won the ${result.title.toLocaleLowerCase()} keep it up`);
        }
    } catch (error) {
        console.error('Error in cronJonChallengeOpenAndClose:- ', error);
    }
};

export const getUserListByRank = async (userExist: any, joinedUserIds: mongoose.Types.ObjectId[], groupchallengeId: string, skip: number, limit: number) => {
    return User.aggregate([
        {
            $match: {
                _id: { $in: joinedUserIds }
            }
        },
        {
            $lookup: {
                from: 'posts',
                let: { userId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$user', '$$userId'] },
                                    { $eq: ['$groupchallengeId', new mongoose.Types.ObjectId(groupchallengeId)] }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            likesCount: { $size: { $ifNull: ['$likes', []] } },
                            dislikesCount: { $size: { $ifNull: ['$dislikes', []] } }
                        }
                    },
                    {
                        $count: 'postCount'
                    }
                ],
                as: 'userPosts'
            }
        },
        {
            $addFields: {
                totalLikes: {
                    $sum: '$userPosts.likesCount'
                },
                totalDislikes: {
                    $sum: '$userPosts.dislikesCount'
                },
            }
        },
        {
            $addFields: {
                rank: {
                    $cond: [
                        { $gt: [{ $add: ['$totalLikes', '$totalDislikes'] }, 0] },
                        {
                            $multiply: [
                                {
                                    $divide: [
                                        { $subtract: ['$totalLikes', '$totalDislikes'] },
                                        { $add: ['$totalLikes', '$totalDislikes', 1] }
                                    ]
                                },
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
                sortBy: { rank: -1 },
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
                isFriend: {
                    $cond: {
                        if: { $gt: [{ $type: userExist }, 'missing'] }, // Check if userExist is not missing
                        then: { $in: ['$_id', { $ifNull: [userExist.friends, []] }] },
                        else: false
                    }
                }
            }
        },
        { $skip: skip },
        { $limit: Number(limit) }
    ]);
}

export const challengeWinnerUserAnnouncement = async (groupchallengeId: string, skip: number, limit: number, message: string) => {

    const groupChallenge = await GroupChallenge.findOne({ _id: new mongoose.Types.ObjectId(groupchallengeId) }).lean();

    const joinedUserIds = groupChallenge?.join_challenge || [];
    const userList = await getUserListByRank({}, joinedUserIds, groupchallengeId, skip, limit)

    if (userList.length > 0) {
        for (let i = 0; i < userList.length; i++) {
            const user = userList[i];
            await sendNotificationToUser(user._id.toString(), message); 
        }
    }
}

export const getJoinUserRateByPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { groupId, groupchallengeId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const userExist = await checkUserIsExist(userId!, req, res);
        if (!userExist) {
            return; // Exit early if user does not exist
        }

        const groupExist = await checkGroupIsExist(groupId!, req, res);
        if (!groupExist) {
            return; // Exit early if group does not exist
        }

        const groupChallengeExist = await checkGroupChallengeIsExist(groupchallengeId!, req, res);
        if (!groupChallengeExist) {
            return; // Exit early if group chellenge does not exist
        }

        const groupChallengeList = await GroupChallenge.findOne({ _id: groupchallengeId, 'join_challenge': userId })
        if (!groupChallengeList) {
            return httpResponse(req, res, 403, "User is not part of any challenge group");
        }

        // Get the user list who joined the challenge
        const groupChallenge = await GroupChallenge.findOne({ _id: groupchallengeId }).lean();

        const joinedUserIds = groupChallenge?.join_challenge || [];

        const totalUsers = await User.aggregate([
            { $match: { _id: { $in: joinedUserIds } } }, { $count: "total" }
        ]);

        const total = totalUsers.length > 0 ? totalUsers[0].total : 0;
        const totalPages = Math.max(1, Math.ceil((totalUsers[0].total || 0) / limit));;
        const validPage = Math.min(Math.max(1, page), totalPages);
        const skip = (validPage - 1) * limit;

        const userRanks = await getUserListByRank(userExist, joinedUserIds, groupchallengeId, skip, limit)

        return httpResponse(req, res, 200, "Group challenge fetched successfully.", {
            pagination: {
                total,
                page,
                limit,
                totalPages: totalPages
            }, userRanks
        });

    } catch (error) {
        return httpError(next, error, req, 500);
    }
}
