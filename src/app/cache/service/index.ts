import { Callback, RedisClient } from 'redis'
import { redisClient } from '../../../lib'
import { UserPlainObject } from '../../user'

export const cacheServiceFactory = (deps: ChacheServiceDependencies) => {
	function cacheUser(user: UserPlainObject, cb?: Callback<number>): boolean {
		return deps.redisClient.HSET(
			_buildKey(user.id),
			'data',
			JSON.stringify(user),
			cb
		)
	}

	function getCachedUser(userId: string, cb?: Callback<string>): boolean {
		return deps.redisClient.HGET(_buildKey(userId), 'data', cb)
	}

	function invalidateUserCache(userId: string, cb?: Callback<number>): boolean {
		return deps.redisClient.HDEL(_buildKey(userId), 'data', cb)
	}

	function _buildKey(userId: string): string {
		return `user:${userId}`
	}

	return { cacheUser, invalidateUserCache, getCachedUser }
}

export default cacheServiceFactory({ redisClient })
export const cacheServiceEvents = {
	invalidateUserCache: 'invalidateUserCache'
}

export type ChacheServiceDependencies = {
	redisClient: RedisClient
}

export type CacheService = ReturnType<typeof cacheServiceFactory>
