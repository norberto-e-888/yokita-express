import redis from 'redis'
import IORedis from 'ioredis'
import logger from '../logger'

export const redisClient = redis.createClient()
export const redisConnection = new IORedis()

redisClient.on('error', function (error) {
	logger.error('cache.redisClient %o', error)
})
