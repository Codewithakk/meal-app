import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { addAndRemoveFriend, getUserByFriendList, getUserList } from '../../controllers/community/user.controller'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User (friend) List
 */

/**
 * @swagger
 * /api/v1/user/friend/{friendId}:
 *   patch:
 *     summary: Update a friend's details
 *     description: Update details of a specific friend by their ID.
 *     operationId: updateFriend
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the friend to update.
 *       - in: body
 *         name: friend
 *         required: true
 *         description: The updated details of the friend.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friendName:
 *                   type: string
 *                   description: The updated name of the friend.
 *                 email:
 *                   type: string
 *                   description: The updated email of the friend.
 *     responses:
 *       200:
 *         description: The friend was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friendId:
 *                   type: string
 *                 friendName:
 *                   type: string
 *                 email:
 *                   type: string
 *       400:
 *         description: Invalid input data.
 *       404:
 *         description: Friend not found.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
router.patch('/friend/:friendId', authMiddleware, addAndRemoveFriend)

/**
 * @swagger
 * /api/v1/user/list:
 *   get:
 *     summary: Get a list of users
 *     description: Retrieve a list of users with pagination and search functionality.
 *     operationId: getUserList
 *     parameters:
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           default: 5
 *         description: The number of items per page.
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: The search query for filtering users.
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       userName:
 *                         type: string
 *                       email:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/list', authMiddleware, getUserList)

/**
 * @swagger
 * /api/v1/user/friend/list:
 *   get:
 *     summary: Get a list of friends
 *     description: Retrieve a list of friends with pagination and search functionality.
 *     operationId: getFriendList
 *     parameters:
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of items per page.
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: The search query for filtering friends.
 *     responses:
 *       200:
 *         description: A list of friends
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       friendId:
 *                         type: string
 *                       friendName:
 *                         type: string
 *                       email:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/friend/list', authMiddleware, getUserByFriendList)

export default router
