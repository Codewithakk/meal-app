import cron from 'node-cron'
import { cronJonChallengeOpenAndClose } from '../controllers/community/groupChallenge.controller'
import { cronJonStreakByUser } from '../controllers/streak/streak.controller'

export const startChallengeStatusCron = () => {
    cron.schedule('*/10 * * * * *', async () => {
        const now = new Date()
        await cronJonChallengeOpenAndClose(now)

        //Check Streak By User
        await cronJonStreakByUser(now)
    })
}
