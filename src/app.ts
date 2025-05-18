import express, { Application, NextFunction, Request, Response } from 'express'
import path from 'path'
import globalErrorHandler from './middlewares/globalErrorHandler'
import responseMessage from './constant/responseMessage'
import httpError from './utils/httpError'
import helmet from 'helmet'
import cors from 'cors'
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

// Routes
import authRoutes from './routes/auth/auth.routes'
import dietprefrence from './routes/common.routes'
import onboardingRoutes from './routes/onboarding/onboarding.routes'
import mealsRoutes from './routes/meal/meal.routes'
import reviewRoutes from './routes/review.routes'
import homeRoute from './routes/home/home.routes'
import smartmealRoutes from './routes/smartMeal/smart-meal.routes'
import communityRoutes from './routes/community/community.routes'
import shareMediaLinksRoutes from './routes/shareLink.routes'
import { serveSwaggerDocs } from './swagger' // Import Swagger setup
import { sendNotificationToUser } from './controllers/notification/notification.controller'
import notificationRoutes from './routes/notification/notification.routes'
import profileRoutes from './routes/profile/profile.route'
import subscriptionRoutes from './routes/subscriptionPlan/subscriptionplan.routes'
import userRoutes from './routes/user/user.routes'
import groupRoutes from './routes/group/group.routes'
import groupChallengeRoutes from './routes/groupChallenge/groupChallenge.routes'
import { stockeAuthMiddleware } from './middlewares/auth.middleware'
import streakRoutes from './routes/streak/streak.routes'
import couponRoutes from './routes/coupon/coupon.routes'

const app: Application = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*', // Replace with frontend URL in production
        methods: ['GET', 'POST']
    }
})

// Store connected users

io.on('connection', (socket: Socket) => {
    const { userId } = socket.user || {}
    socket.join('user_' + userId)

    socket.on('send_notification', async ({ userId, message }: { userId: string; message: string }) => {
        await sendNotificationToUser(userId, message) // ✅ Using function directly
    })

    socket.on('disconnect', () => {
        io.in('user_' + userId).disconnectSockets(true)
        socket.broadcast.emit('user-disconnected', parseInt(socket.id))
    })
})

io.use(stockeAuthMiddleware)

// Middleware
app.use(helmet())
app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(express.static(path.join(__dirname, '../', 'public')))

// Serve Swagger API Docs
serveSwaggerDocs(app)

// Routes
app.get('/', (_: Request, res: Response) => {
    res.status(200).json({ message: 'Welcome to the Mood-meal Backend API' })
})

// Serve the privacy policy page
app.get('/privacy-policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'privacy-policy.html'))
})

app.get('/account-delete', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'account-delete.html'));
});

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/onboarding', onboardingRoutes)
app.use('/api/v1/dietary-preferences', dietprefrence)
app.use('/api/v1/home', homeRoute)
app.use('/api/v1/meals', mealsRoutes)
app.use('/api/v1/review', reviewRoutes)
app.use('/api/v1/community', communityRoutes)
app.use('/api/v1/smart-meal-generator', smartmealRoutes)
app.use('/api/v1/share', shareMediaLinksRoutes)
app.use('/api/v1/notifications', notificationRoutes)
app.use('/api/v1/profile', profileRoutes)
app.use('/api/v1/subscription', subscriptionRoutes)
app.use('/api/v1/user', userRoutes)
app.use('/api/v1/group', groupRoutes, groupChallengeRoutes)
app.use('/api/v1/mood', streakRoutes)
app.use('/api/v1/coupon', couponRoutes)

// 404 Handler
app.use((req: Request, _: Response, next: NextFunction) => {
    try {
        throw new Error(responseMessage.NOT_FOUND('route'))
    } catch (err) {
        httpError(next, err, req, 404)
    }
})

// Global Error Handler
app.use(globalErrorHandler)

server.listen(5000, () => {
    console.log('Server running on port 5000')
})

export { app, io }
