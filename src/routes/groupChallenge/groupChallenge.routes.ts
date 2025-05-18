import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware'
import validateRequest from '../../middlewares/validateRequest'
import { addGroupChallengeZodSchema, updateGroupChallengeZodSchema } from '../../validations/group.validation'
import upload from '../../config/multerConfig'
import {
    createGroupChallenge,
    deleteGroupChallenge,
    getGroupChallengeByJoinList,
    getGroupChallengeList,
    getGroupChallengeUserList,
    getJoinUserRateByPost,
    joinAndLeftGroupChallenge,
    updateGroupChallenge
} from '../../controllers/community/groupChallenge.controller'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Group Chellenge
 *   description: Community Group Chellenge
 */

router.post('/:groupId/challenge', authMiddleware, upload.single('challengeImage'), validateRequest(addGroupChallengeZodSchema), createGroupChallenge)

router.patch(
    '/:groupId/challenge/:groupchallengeId',
    authMiddleware,
    upload.single('challengeImage'),
    validateRequest(updateGroupChallengeZodSchema),
    updateGroupChallenge
)

router.delete('/:groupId/challenge/:groupchallengeId', authMiddleware, deleteGroupChallenge)

router.get('/:groupId/challenge', authMiddleware, getGroupChallengeList)

router.patch('/:groupId/challenge/:groupchallengeId/join_leave', authMiddleware, joinAndLeftGroupChallenge)

router.get('/:groupId/challenge/:groupchallengeId/join_list', authMiddleware, getGroupChallengeByJoinList)

router.get('/:groupId/challenge/:groupchallengeId/user_list', authMiddleware, getGroupChallengeUserList)

router.get('/:groupId/challenge/:groupchallengeId/leaderboard', authMiddleware, getJoinUserRateByPost)

export default router
