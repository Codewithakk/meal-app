import { app } from './app'
import config from './config/config'
import { initRateLimiter } from './config/rateLimiter'
import { startChallengeStatusCron } from './cronjob/challengeCron'
import databaseService from './services/database.service'
import logger from './utils/logger'

const server = app.listen(5001)

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ; (async () => {
        try {
            // Database Connection
            const connection = await databaseService.connect()
            logger.info(`DATABASE_CONNECTION`, {
                meta: {
                    CONNECTION_NAME: connection.name
                }
            })

            initRateLimiter(connection)

            // Start the cron job
            startChallengeStatusCron();

            logger.info(`RATE_LIMITER_INITIATED`)

            logger.info(`APPLICATION_STARTED`, {
                meta: {
                    PORT: config.PORT,
                    SERVER_URL: config.SERVER_URL
                }
            })
        } catch (err) {
            logger.error(`APPLICATION_ERROR`, { meta: err })

            server.close((error) => {
                if (error) {
                    logger.error(`APPLICATION_ERROR`, { meta: error })
                }

                process.exit(1)
            })
        }
    })()
