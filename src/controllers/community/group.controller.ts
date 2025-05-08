import { Request, Response, NextFunction } from 'express';
import httpError from '../../utils/httpError';
import httpResponse from '../../utils/httpResponse';
import mongoose from 'mongoose';
import { checkUserIsExist } from '../profile/profile.controller';
import { Group, IJoinGroup } from '../../models/group.model';
import User from "../../models/user.model";
import Post from '../../models/community/userPost.model';
import { deleteImages } from '../../utils/deleteImage';

export const checkGroupIsExist = async (groupId: string, req: Request, res: Response) => {
    const group = await Group.findById(groupId);
    if (!group) {
        return httpResponse(req, res, 404, "Group not found.");
    }
    return group
}

export const createGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { title } = req.body
        const groupProfile = req.file ? req.file.path : null;

        const user = await checkUserIsExist(userId!, req, res);
        if (!user) {
            return; // Exit early if user does not exist
        }

        const joinGroupFormatted = {
            user: new mongoose.Types.ObjectId(userId),
            isOwner: true
        };

        // Create group
        const group = new Group({
            title,
            groupProfile,
            join_group: [joinGroupFormatted],
        });

        await group.save();

        return httpResponse(req, res, 201, "Groups Created Successfully", { group });
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const updateGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { title } = req.body
        const { groupId } = req.params;
        const groupProfile = req.file ? req.file.path : null;

        const user = await checkUserIsExist(userId!, req, res);
        if (!user) {
            return; // Exit early if user does not exist
        }

        const groupExist = await checkGroupIsExist(groupId!, req, res);
        if (!groupExist) {
            return; // Exit early if group does not exist
        }

        const isOwner = groupExist.join_group.some((member) => member.user.toString() === userId && member.isOwner);
        if (!isOwner) {
            return httpResponse(req, res, 403, "Unauthorized to update this group.");
        }

        await Group.updateOne({
            _id: groupId,
        }, {
            $set: {
                title,
                groupProfile,
            }
        })

        return httpResponse(req, res, 200, "Groups updated successfully.");
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const deleteGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { groupId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return httpResponse(req, res, 400, "Invalid Group ID");
        }

        const user = await checkUserIsExist(userId!, req, res);
        if (!user) {
            return; // Exit early if user does not exist
        }

        const groupExist = await checkGroupIsExist(groupId!, req, res);
        if (!groupExist) {
            return; // Exit early if group does not exist
        }

        const isOwner = groupExist.join_group.some((member) => member.user.toString() === userId && member.isOwner);
        if (!isOwner) {
            return httpResponse(req, res, 403, "Unauthorized to delete this group");
        }

        if (groupExist && groupExist?.groupProfile) {
            const match = groupExist?.groupProfile?.match(/upload\/(?:v\d+\/)?(.+?)\.[^\/]+$/);
            const imageName = match ? match[1] : ''
            imageName != '' ? await deleteImages([imageName]) : ""
        }

        const postsList = await Post.find({ group: groupId })
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

            await Post.deleteOne({ _id: post._id, group: groupId });
        })

        await Group.deleteOne({ _id: groupId });

        return httpResponse(req, res, 200, "Group Delete successfully");
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const deleteGroupImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { groupId } = req.params;

        const user = await checkUserIsExist(userId!, req, res);
        if (!user) {
            return; // Exit early if user does not exist
        }

        const groupExist = await checkGroupIsExist(groupId!, req, res);
        if (!groupExist) {
            return; // Exit early if group does not exist
        }

        const isOwner = groupExist.join_group.some((member) => member.user.toString() === userId && member.isOwner);
        if (!isOwner) {
            return httpResponse(req, res, 403, "Unauthorized to delete this group image");
        }

        if (groupExist && groupExist?.groupProfile) {
            const match = groupExist?.groupProfile?.match(/upload\/(?:v\d+\/)?(.+?)\.[^\/]+$/);
            const imageName = match ? match[1] : ''
            imageName != '' ? await deleteImages([imageName]) : ""
        }

        Group.updateOne({ _id: groupId }, {
            $set: {
                groupProfile: null,
            }
        })

        return httpResponse(req, res, 200, "Groups image delete Successfully");
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const addUserToGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { groupId } = req.params;
        const { join_group } = req.body

        const userData = await checkUserIsExist(userId!, req, res);
        if (!userData) {
            return; // Exit early if user does not exist
        }

        const groupExist = await checkGroupIsExist(groupId!, req, res);
        if (!groupExist) {
            return; // Exit early if group does not exist
        }

        const isOwner = groupExist.join_group.some((member) => member.user.toString() === userId && member.isOwner);
        if (!isOwner) {
            return httpResponse(req, res, 403, "Unauthorized to add user to this group.");
        }

        // Convert incoming array to a Map for quick lookup
        const incomingUsersMap = new Map<string, boolean>();
        join_group.map(async (u: { user: string; isOwner?: boolean }) => {
            const userExist = await User.findById(userId)
            if (userExist) {
                incomingUsersMap.set(u.user, u.isOwner || false);
            }
        });

        // Update existing users' isOwner flag if necessary
        groupExist.join_group.forEach((existing: any) => {
            const incomingIsOwner = incomingUsersMap.get(existing.user.toString());

            if (incomingIsOwner !== undefined) {
                // Update isOwner if it changed
                if (existing.isOwner !== incomingIsOwner) {
                    existing.isOwner = incomingIsOwner;
                }
                // Mark as processed
                incomingUsersMap.delete(existing.user.toString());
            }
        });

        // Add new users (remaining ones in the map)
        for (const [user, isOwner] of incomingUsersMap) {
            groupExist.join_group.push({
                user: new mongoose.Types.ObjectId(user),
                isOwner,
            } as IJoinGroup);
        }

        await groupExist.save();

        return httpResponse(req, res, 200, "User group joined successfully.");
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const removeUserToGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { groupId } = req.params;
        const { userIds } = req.body

        const userData = await checkUserIsExist(userId!, req, res);
        if (!userData) {
            return; // Exit early if user does not exist
        }

        const groupExist = await checkGroupIsExist(groupId!, req, res);
        if (!groupExist) {
            return; // Exit early if group does not exist
        }

        const isOwner = groupExist.join_group.some((member) => member.user.toString() === userId && member.isOwner);
        if (!isOwner) {
            return httpResponse(req, res, 403, "Unauthorized to remove user from this group.");
        }

        if (!Array.isArray(groupExist.join_group)) {
            groupExist.join_group = [];
        }

        // Remove users whose userId matches any in the list
        groupExist.join_group = groupExist.join_group.filter(join => {
            return !userIds.includes(join.user.toString());
        });

        await groupExist.save();

        return httpResponse(req, res, 200, "Group of users removed successfully.");
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const joinGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { groupId } = req.params;

        const userData = await checkUserIsExist(userId!, req, res);
        if (!userData) {
            return; // Exit early if user does not exist
        }

        const groupExist = await checkGroupIsExist(groupId!, req, res);
        if (!groupExist) {
            return; // Exit early if group does not exist
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Check if user is already in the group
        const userIndex = groupExist.join_group.findIndex((member: any) =>
            member.user.toString() === userId
        );

        if (userIndex !== -1) {
            // User exists, remove them (leave group)
            groupExist.join_group.splice(userIndex, 1);
            await groupExist.save();
            return httpResponse(req, res, 200, "User removed from group.");
        } else {
            // User doesn't exist, add them (join group)
            groupExist.join_group.push({
                user: userObjectId,
                isOwner: false,
            } as IJoinGroup);
            await groupExist.save();
            return httpResponse(req, res, 200, "User added to group.");
        }
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const getGroupList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;

        // Pagination and Search
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string || '').trim();

        const user = await checkUserIsExist(userId!, req, res);
        if (!user) {
            return; // Exit early if user does not exist
        }

        const searchFilter: any = {};
        if (search) {
            const regex = new RegExp(search, 'i'); // case-insensitive search
            searchFilter.$or = [{ title: regex }];
        }

        const totalCount = await Group.countDocuments(searchFilter)

        const totalPages = Math.max(1, Math.ceil(totalCount / limit));;
        const validPage = Math.min(Math.max(1, page), totalPages);
        const skip = (validPage - 1) * limit;

        const groupsList = await Group.aggregate([
            { $match: searchFilter },
            {
                $addFields: {
                    memberCount: { $size: '$join_group' },
                    isJoined: {
                        $in: [
                            new mongoose.Types.ObjectId(userId), {
                                $map: {
                                    input: '$join_group',
                                    as: 'jg',
                                    in: '$$jg.user'
                                }
                            }
                        ]
                    }
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    groupProfile: 1,
                    createdAt: 1,
                    memberCount: 1,
                    isJoined: 1
                }
            }
        ]);

        return httpResponse(req, res, 200, "Groups Fetched Successfully", {
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: totalPages
            },
            groupsList
        });
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const getGroupByJoinList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;

        // Pagination and Search
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string || '').trim();

        const user = await checkUserIsExist(userId!, req, res);
        if (!user) {
            return; // Exit early if user does not exist
        }

        const searchFilter: any = {
            'join_group.user': new mongoose.Types.ObjectId(userId)
        };
        if (search) {
            const regex = new RegExp(search, 'i'); // case-insensitive search
            searchFilter.$or = [{ title: regex }];
        }

        const totalCount = await Group.countDocuments(searchFilter)

        const totalPages = Math.max(1, Math.ceil(totalCount / limit));;
        const validPage = Math.min(Math.max(1, page), totalPages);
        const skip = (validPage - 1) * limit;

        const groupsList = await Group.aggregate([
            { $match: searchFilter },
            {
                $addFields: {
                    memberCount: { $size: '$join_group' },
                    isJoined: {
                        $in: [
                            new mongoose.Types.ObjectId(userId), {
                                $map: {
                                    input: '$join_group',
                                    as: 'jg',
                                    in: '$$jg.user'
                                }
                            }
                        ]
                    }
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    groupProfile: 1,
                    createdAt: 1,
                    memberCount: 1,
                    isJoined: 1
                }
            }
        ]);

        return httpResponse(req, res, 200, "Groups Fetched Successfully", {
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: totalPages
            },
            groupsList
        });
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const getGroupUserList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { groupId } = req.params;

        // Pagination and Search
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string || '').trim();

        const user = await checkUserIsExist(userId!, req, res);
        if (!user) return;

        const searchFilter: any = {
            _id: new mongoose.Types.ObjectId(groupId)
        };

        const regex = search ? new RegExp(search, 'i') : null;

        const totalCount = await Group.countDocuments(searchFilter);

        const totalPages = Math.max(1, Math.ceil(totalCount / limit));;
        const validPage = Math.min(Math.max(1, page), totalPages);
        const skip = (validPage - 1) * limit;

        const groupsWithCount = await Group.aggregate([
            { $match: searchFilter },

            // Check if current user isOwner in the group
            {
                $addFields: {
                    userEntry: {
                        $first: {
                            $filter: {
                                input: "$join_group",
                                as: "member",
                                cond: { $eq: ["$$member.user", new mongoose.Types.ObjectId(userId)] }
                            }
                        }
                    },
                    memberCount: { $size: "$join_group" }
                }
            },

            // Filter groups where user is part of join_group
            {
                $match: {
                    "userEntry": { $ne: null } // Only proceed if user exists in join_group
                }
            },

            // Lookup member details from users collection
            {
                $lookup: {
                    from: "users",
                    let: {
                        members: "$join_group",
                        isOwner: "$userEntry.isOwner"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $cond: [
                                        "$$isOwner", // If isOwner == true
                                        { $in: ["$_id", "$$members.user"] }, // Fetch all members
                                        { $eq: ["$_id", new mongoose.Types.ObjectId(userId)] } // Else, just self
                                    ]
                                },
                                ...(regex && {
                                    $or: [
                                        { firstName: { $regex: regex } },
                                        { lastName: { $regex: regex } }
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
                                isFriend: { $in: ['$_id', user.friends] }
                            }
                        }
                    ],
                    as: "memberDetails"
                }
            },

            // Clean up output
            {
                $project: {
                    title: 1,
                    description: 1,
                    createdAt: 1,
                    memberCount: 1,
                    isOwner: "$userEntry.isOwner",
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
            groupsWithCount
        });

    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const joinAndLeftGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { groupId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return httpResponse(req, res, 400, "Invalid Group ID");
        }

        const user = await checkUserIsExist(userId!, req, res);
        if (!user) {
            return; // Exit early if user does not exist
        }

        const groupData = await Group.findById(groupId);
        if (!groupData) {
            return httpResponse(req, res, 404, "Group not found");
        }

        if (!Array.isArray(groupData.join_group)) {
            groupData.join_group = [];
        }

        const userObjectId = new mongoose.Types.ObjectId(userId) as any;
        const userIndex = groupData.join_group.findIndex(join => join.user.toString() === userId);
        if (userIndex !== -1) {
            // User already in group, so remove
            groupData.join_group.splice(userIndex, 1);
            await groupData.save();
            return httpResponse(req, res, 200, "Group left successfully.");
        } else {
            groupData.join_group.push({
                user: userObjectId,
                isOwner: false
            } as IJoinGroup);
            await groupData.save();
            return httpResponse(req, res, 200, "Group joined successfully.");
        }
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};

export const leaveGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { groupId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return httpResponse(req, res, 400, "Invalid Group ID");
        }

        const user = await checkUserIsExist(userId!, req, res);
        if (!user) {
            return; // Exit early if user does not exist
        }

        const groupData = await checkGroupIsExist(groupId!, req, res);
        if (!groupData) {
            return; // Exit early if group does not exist
        }

        const isOwner = groupData.join_group.some((member) => member.user.toString() === userId);
        if (!isOwner) {
            return httpResponse(req, res, 403, "You are not part of this group.");
        }

        if (!Array.isArray(groupData.join_group)) {
            groupData.join_group = [];
        }

        const userIndex = groupData.join_group.findIndex(join => join.user.toString() === userId);
        if (userIndex !== -1) {
            // User already in group, so remove
            groupData.join_group.splice(userIndex, 1);
            await groupData.save();
        }
        return httpResponse(req, res, 200, "Group leave successfully");
    } catch (error) {
        return httpError(next, error, req, 500);
    }
};