import express from 'express'
import {
    createPost,
    getPosts,
    sharePost,
    viewPost,
    feed,
    likePost,
    dislikePost,
    getCommentCount,
    addComment,
    updateComment,
    deleteComment,
    getCommentById,
    getLinkCount,
    getDisLikeCount,
    deletePost,
    updatePost,
    deletePostImage,
    createPostForChallenge,
    getChallengePosts
} from '../../controllers/community/userPost.controller'
import upload from '../../config/multerConfig'
import { authMiddleware } from '../../middlewares/auth.middleware'
import validateRequest from '../../middlewares/validateRequest'
import { addCommentSchema, addPostSchema } from '../../validations/community.validation'
const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Community
 *   description: Community API endpoints
 */

/**
 * @swagger
 * /api/v1/community/post:
 *   post:
 *     summary: Create a new post
 *     description: Allows an authenticated user to create a post with optional images.
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "My First Post"
 *               about:
 *                 type: string
 *                 example: "This is a post about technology."
 *               description:
 *                 type: string
 *                 example: "A detailed description of the post content."
 *               hashtags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["#Tech", "#Innovation"]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 example: ["image1.jpg", "image2.png"]
 *     responses:
 *       201:
 *         description: Post Created Successfully
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
 *                   example: "Post Created Successfully"
 *       400:
 *         description: Bad request (e.g., missing required fields)
 *       401:
 *         description: Unauthorized (user not authenticated)
 *       500:
 *         description: Internal server error
 */
router.post('/:groupId/post', authMiddleware, upload.array('images'), validateRequest(addPostSchema), createPost)

/**
 * @swagger
 * /api/v1/community/posts:
 *   get:
 *     summary: Retrieve all posts
 *     description: Fetches all posts with user details, sorted by creation date.
 *     tags: [Community]
 *     responses:
 *       200:
 *         description: Posts Fetched Successfully
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
 *                   example: "Posts Fetched Successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: object
 *                         properties:
 *                           userProfile:
 *                             type: string
 *                             example: "https://image-url.com/profile.jpg"
 *                           userName:
 *                             type: string
 *                             example: "JohnDoe"
 *                       title:
 *                         type: string
 *                         example: "My First Post"
 *                       description:
 *                         type: string
 *                         example: "This is an amazing post!"
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *                           example: "https://image-url.com/image.jpg"
 *                       hashtags:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["#Tech", "#Innovation"]
 *                       likes:
 *                         type: number
 *                         example: 10
 *                       dislikes:
 *                         type: number
 *                         example: 2
 *                       shares:
 *                         type: number
 *                         example: 5
 *                       viewcount:
 *                         type: number
 *                         example: 100
 *                       comments:
 *                         type: number
 *                         example: 3
 *       500:
 *         description: Internal server error
 */
router.get('/posts', authMiddleware, getPosts)

/**
 * @swagger
 * /api/v1/community/post/share/{postId}:
 *   post:
 *     summary: Share a post
 *     description: Allows a user to share a post.
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to be shared
 *     responses:
 *       201:
 *         description: Post Shared Successfully
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
 *                   example: "Post Shared Successfully"
 *       400:
 *         description: Post already shared
 *       500:
 *         description: Internal server error
 */
router.post('/post/share/:postId', authMiddleware, sharePost)

/**
 * @swagger
 * /api/v1/community/post/view/{postId}:
 *   post:
 *     summary: View a post
 *     description: Increases the view count of a post if the user has not already viewed it.
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to be viewed
 *     responses:
 *       200:
 *         description: Post viewed successfully
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
 *                   example: "Post viewed successfully"
 *       401:
 *         description: Unauthorized (user not authenticated)
 *       500:
 *         description: Internal server error
 */
router.put('/post/view/:postId', authMiddleware, viewPost)

/**
 * @swagger
 * /api/v1/community/post/{postId}/like:
 *   post:
 *     summary: Like a community post
 *     tags:
 *       - Community
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to like
 *     responses:
 *       200:
 *         description: Post liked successfully
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
 *                   example: Post liked successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.post('/post/:postId/like', authMiddleware, likePost)

/**
 * @swagger
 * /api/v1/community/post/{postId}/dislike:
 *   post:
 *     summary: Dislike a community post
 *     tags:
 *       - Community
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to dislike
 *     responses:
 *       200:
 *         description: Post disliked successfully
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
 *                   example: Post disliked successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.post('/post/:postId/dislike', authMiddleware, dislikePost)

/**
 * @swagger
 * /api/v1/community/post/{postId}/comment:
 *   post:
 *     summary: Add a comment to a post
 *     description: Allows users to post a comment to a specific post.
 *     operationId: addCommentToPost
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to comment on.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commentText:
 *                 type: string
 *                 description: The text content of the comment.
 *                 example: "Good Food"
 *     responses:
 *       '200':
 *         description: Successfully added comment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment added successfully"
 *       '400':
 *         description: Bad request (Invalid data)
 *       '404':
 *         description: Post not found
 *       '401':
 *         description: Unauthorized
 */
router.post('/post/:postId/comment', authMiddleware, validateRequest(addCommentSchema), addComment)

/**
 * @swagger
 * /api/v1/community/post/{postId}/comment/{commentId}:
 *   patch:
 *     summary: Update a comment on a post
 *     description: Allows users to update an existing comment on a specific post.
 *     operationId: updateCommentOnPost
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post where the comment belongs.
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment to be updated.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commentText:
 *                 type: string
 *                 description: The updated text content of the comment.
 *                 example: "Not Good Food"
 *     responses:
 *       '200':
 *         description: Successfully updated comment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment updated successfully"
 *       '400':
 *         description: Bad request (Invalid data)
 *       '404':
 *         description: Post or comment not found
 *       '401':
 *         description: Unauthorized
 */
router.patch('/post/:postId/comment/:commentId', authMiddleware, validateRequest(addCommentSchema), updateComment)

/**
 * @swagger
 * /api/v1/community/post/{postId}/comment/{commentId}:
 *   delete:
 *     summary: Delete a comment from a post
 *     description: Allows users to delete a specific comment on a post.
 *     operationId: deleteCommentFromPost
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post where the comment is located.
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment to be deleted.
 *     responses:
 *       '200':
 *         description: Successfully deleted comment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment deleted successfully"
 *       '400':
 *         description: Bad request (Invalid data)
 *       '404':
 *         description: Post or comment not found
 *       '401':
 *         description: Unauthorized
 */
router.delete('/post/:postId/comment/:commentId', authMiddleware, deleteComment)

/**
 * @swagger
 * /api/v1/community/post/{postId}/comment/{commentId}:
 *   get:
 *     summary: Get a specific comment from a post
 *     description: Fetches a specific comment on a given post using the comment ID.
 *     operationId: getCommentFromPost
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post where the comment is located.
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment to retrieve.
 *     responses:
 *       '200':
 *         description: Successfully fetched the comment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 commentId:
 *                   type: string
 *                   example: "67fcf1903870ced259606ad6"
 *                 commentText:
 *                   type: string
 *                   example: "Good Food"
 *                 postId:
 *                   type: string
 *                   example: "67f8fad14f4caa73bc37617a"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-15T12:34:56Z"
 *       '404':
 *         description: Post or comment not found
 *       '401':
 *         description: Unauthorized
 */
router.get('/post/:postId/comment/:commentId', authMiddleware, getCommentById)

/**
 * @swagger
 * /api/v1/community/post/{postId}/comments/count:
 *   get:
 *     summary: Get the count of comments for a post
 *     description: Fetches the number of comments associated with a specific post.
 *     operationId: getCommentCountForPost
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post for which the comment count is being retrieved.
 *     responses:
 *       '200':
 *         description: Successfully retrieved the comment count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 15
 *       '404':
 *         description: Post not found
 *       '401':
 *         description: Unauthorized
 */
router.get('/post/:postId/comments/count', authMiddleware, getCommentCount)

/**
 * @swagger
 * /api/v1/community/post/{postId}/like/count:
 *   get:
 *     summary: Get the count of likes for a post
 *     description: Fetches the number of likes associated with a specific post.
 *     operationId: getLikeCountForPost
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post for which the like count is being retrieved.
 *     responses:
 *       '200':
 *         description: Successfully retrieved the like count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 120
 *       '404':
 *         description: Post not found
 *       '401':
 *         description: Unauthorized
 */
router.get('/post/:postId/like/count', authMiddleware, getLinkCount)

/**
 * @swagger
 * /api/v1/community/post/{postId}/dislike/count:
 *   get:
 *     summary: Get the count of dislikes for a post
 *     description: Fetches the number of dislikes associated with a specific post.
 *     operationId: getDislikeCountForPost
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post for which the dislike count is being retrieved.
 *     responses:
 *       '200':
 *         description: Successfully retrieved the dislike count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 30
 *       '404':
 *         description: Post not found
 *       '401':
 *         description: Unauthorized
 */
router.get('/post/:postId/dislike/count', authMiddleware, getDisLikeCount)

/**
 * @swagger
 * /api/v1/community/post/{postId}:
 *   delete:
 *     summary: Delete a post
 *     description: Deletes a specific post by its ID.
 *     operationId: deletePost
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to be deleted.
 *     responses:
 *       '200':
 *         description: Successfully deleted the post
 *       '404':
 *         description: Post not found
 *       '401':
 *         description: Unauthorized
 *       '400':
 *         description: Invalid request (e.g., wrong format)
 */
router.delete('/post/:postId/', authMiddleware, deletePost)

/**
 * @swagger
 * /api/v1/community/post/images/{postId}:
 *   delete:
 *     summary: Delete images from a post
 *     description: Deletes specified images from a specific post by its ID.
 *     operationId: deleteImagesFromPost
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post from which images will be deleted.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageList:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of image URLs to be deleted from the post.
 *             required:
 *               - imageList
 *     responses:
 *       '200':
 *         description: Successfully deleted the specified images
 *       '404':
 *         description: Post not found or images not found
 *       '401':
 *         description: Unauthorized
 *       '400':
 *         description: Bad request (e.g., invalid image URL format)
 */
router.delete('/post/images/:postId/', authMiddleware, deletePostImage)

/**
 * @swagger
 * /api/v1/community/post/{postId}:
 *   patch:
 *     summary: Update a post
 *     description: Updates the title, description, hashtags, and images of a post.
 *     operationId: updatePost
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to be updated.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               about:
 *                 type: string
 *               hashtags:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Images to be uploaded (files).
 *     responses:
 *       '200':
 *         description: Successfully updated the post
 *       '400':
 *         description: Bad request (e.g., invalid format or missing data)
 *       '404':
 *         description: Post not found
 *       '401':
 *         description: Unauthorized
 */
router.patch('/post/:postId/', authMiddleware, validateRequest(addPostSchema), updatePost)

/**
 * @swagger
 * /api/v1/community/feed:
 *   get:
 *     summary: Get community feed
 *     tags:
 *       - Community
 *     responses:
 *       200:
 *         description: Feed retrieved successfully
 *       400:
 *         description: Invalid request
 */
router.get('/feed', authMiddleware, feed)

router.post(
    '/:groupId/post/challenge/:groupchallengeId',
    authMiddleware,
    upload.array('images'),
    validateRequest(addPostSchema),
    createPostForChallenge
)

router.get('/:groupId/posts/challenge', authMiddleware, getChallengePosts)

export default router
