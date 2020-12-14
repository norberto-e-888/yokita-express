import redis, { Callback, RedisClient } from 'redis'
import { UserPlainObject } from '../../user'

export const redisClient = redis.createClient()
redisClient.on('error', function (error) {
	console.error(error)
})

export const cacheServiceFactory = (deps: ChacheServiceDependencies) => {
	function cacheUser(user: UserPlainObject, cb?: Callback<number>): boolean {
		try {
			return deps.redisClient.HSET(
				_buildKey(user.id, 'user'),
				'data',
				JSON.stringify(user),
				cb
			)
		} catch (error) {
			throw error
		}
	}

	function getCachedUser(userId: string, cb?: Callback<string>): boolean {
		return deps.redisClient.HGET(_buildKey(userId, 'user'), 'data', cb)
	}

	function invalidateUserCache(userId: string, cb?: Callback<number>): boolean {
		return deps.redisClient.HDEL(_buildKey(userId, 'user'), 'data', cb)
	}

	function _buildKey(id: string, resource: 'user'): string {
		return `${resource}:${id}`
	}

	return { cacheUser, invalidateUserCache, getCachedUser }
}

export default cacheServiceFactory({ redisClient })
export const CACHE_EVENTS = {
	invalidateUserCache: 'invalidateUserCache'
}

export type ChacheServiceDependencies = {
	redisClient: RedisClient
}

export type CacheService = ReturnType<typeof cacheServiceFactory>
