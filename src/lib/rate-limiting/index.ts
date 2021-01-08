import RedisStore from 'rate-limit-redis'
import rateLimit from 'express-rate-limit'
import redis from 'redis'

const client = redis.createClient()
const store = new RedisStore({ client })

export const basicLimiter = rateLimit({
	store,
	windowMs: 1000 * 60 * 10,
	max: 6000,
	message: 'Too many requests'
})
