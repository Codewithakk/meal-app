import express from 'express'
import { shareLink } from '../controllers/socialmedia.controller'

const router = express.Router()

router.get('/', shareLink)

export default router
