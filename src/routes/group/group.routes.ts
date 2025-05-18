import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware'
import {
    addUserToGroup,
    createGroup,
    deleteGroup,
    deleteGroupImage,
    getGroupByJoinList,
    getGroupList,
    getGroupUserList,
    joinAndLeftGroup,
    joinGroup,
    leaveGroup,
    removeUserToGroup,
    updateGroup
} from '../../controllers/community/group.controller'
import validateRequest from '../../middlewares/validateRequest'
import { addGroupSchema, addGroupUserSchema } from '../../validations/group.validation'
import upload from '../../config/multerConfig'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Group
 *   description: Community Group
 */

/**
 * @swagger
 * /api/v1/group:
 *   post:
 *     summary: Create a new group
 *     tags:
 *       - Group
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Test Recipe
 *               groupProfile:
 *                 type: string
 *                 format: binary
 *                 description: Group profile image or file
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Bad Request - Missing fields or invalid data
 *       401:
 *         description: Unauthorized - Missing or invalid token
 */
router.post('/', authMiddleware, upload.single('groupProfile'), validateRequest(addGroupSchema), createGroup)

/**
 * @swagger
 * /api/v1/group:
 *   patch:
 *     summary: Update an existing group
 *     tags:
 *       - Group
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Test Recipe
 *               groupProfile:
 *                 type: string
 *                 format: binary
 *                 description: New group profile image or file
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Bad Request - Invalid data or missing fields
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: Group not found
 */
router.patch('/:groupId', authMiddleware, upload.single('groupProfile'), validateRequest(addGroupSchema), updateGroup)

/**
 * @swagger
 * /api/v1/group/{groupId}/user:
 *   patch:
 *     summary: Add or update users in a group
 *     tags:
 *       - Group
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group to update users for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - join_group
 *             properties:
 *               join_group:
 *                 type: array
 *                 description: List of users to add to the group
 *                 items:
 *                   type: object
 *                   required:
 *                     - user
 *                     - isOwner
 *                   properties:
 *                     user:
 *                       type: string
 *                       description: User ID
 *                       example: "67ff82b9f4d5da187f8d150e"
 *                     isOwner:
 *                       type: boolean
 *                       example: false
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users successfully added or updated in the group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Users updated successfully."
 *       400:
 *         description: Bad Request - Missing or invalid data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
router.patch('/:groupId/user', authMiddleware, validateRequest(addGroupUserSchema), addUserToGroup)

/**
 * @swagger
 * /api/v1/group/{groupId}/user/remove:
 *   patch:
 *     summary: Remove users from a group
 *     tags:
 *       - Group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the group
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - userIds
 *     responses:
 *       200:
 *         description: Users removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Users removed from group successfully.
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group or user(s) not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:groupId/user/remove', authMiddleware, removeUserToGroup)

/**
 * @swagger
 * /api/v1/group/{groupId}:
 *   delete:
 *     summary: Delete a group by its ID
 *     tags:
 *       - Group
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group to be deleted
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Group deleted successfully."
 *       400:
 *         description: Bad Request - Invalid group ID
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Only group owner can delete the group
 *       404:
 *         description: Group not found
 */
router.delete('/:groupId', authMiddleware, deleteGroup)

/**
 * @swagger
 * /api/v1/group/{groupId}/image:
 *   delete:
 *     summary: Delete the group's profile image
 *     tags:
 *       - Group
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group whose image is to be deleted
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Group image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Group image deleted successfully."
 *       400:
 *         description: Bad Request - No image to delete or invalid group
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Only group owner can delete the image
 *       404:
 *         description: Group not found
 */
router.delete('/:groupId/image', authMiddleware, deleteGroupImage)

/**
 * @swagger
 * /api/v1/group/{groupId}/join:
 *   patch:
 *     summary: Join a group as the authenticated user
 *     tags:
 *       - Group
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the group to join
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully joined the group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "You have successfully joined the group."
 *       400:
 *         description: Bad Request - Already a member or invalid group
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: Group not found
 */
router.patch('/:groupId/join', authMiddleware, joinGroup)

/**
 * @swagger
 * /api/v1/group/{groupId}:
 *   patch:
 *     summary: Update a group's information
 *     tags:
 *       - Group
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group to update
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Group Title"
 *               description:
 *                 type: string
 *                 example: "Updated group description"
 *               groupProfile:
 *                 type: string
 *                 format: binary
 *                 description: New profile image or document for the group
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Group Title"
 *               description:
 *                 type: string
 *                 example: "Updated group description"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Bad Request - Invalid input data
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Only group owner can update
 *       404:
 *         description: Group not found
 */
router.patch('/:groupId', authMiddleware, joinAndLeftGroup)

/**
 * @swagger
 * /api/v1/group/{groupId}/leave:
 *   patch:
 *     summary: Leave a group as the authenticated user
 *     tags:
 *       - Group
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the group to leave
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully left the group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "You have successfully left the group."
 *       400:
 *         description: Bad Request - User is not a member or can't leave
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Group not found
 */
router.patch('/:groupId/leave', authMiddleware, leaveGroup)

/**
 * @swagger
 * /api/v1/group/list:
 *   get:
 *     summary: Get a paginated list of groups
 *     tags:
 *       - Group
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search term to filter groups
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Group'
 *       401:
 *         description: Unauthorized
 */
router.get('/list', authMiddleware, getGroupList)

/**
 * @swagger
 * /api/v1/group/join/list:
 *   get:
 *     summary: Get a paginated list of groups the user has joined
 *     tags:
 *       - Group
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search term to filter joined groups
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of joined groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 12
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Group'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/join/list', authMiddleware, getGroupByJoinList)

/**
 * @swagger
 * /api/v1/group/{groupId}/user/list:
 *   get:
 *     summary: Get a paginated list of users in a group
 *     tags:
 *       - Group
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the group
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search term to filter users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users in the group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 20
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
router.get('/:groupId/user/list', authMiddleware, getGroupUserList)

export default router
