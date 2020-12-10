import { RedisClient } from 'redis'
import { redisClient } from '../../lib'

export const redisServiceFactory = (deps: RedisServiceDependencies) => {
	function handleBlacklist(ip: string) {
		try {
			deps.redisClient.watch('blacklist', (err) => {
				if (err) throw err
				deps.redisClient
					.multi()
					.SADD('blacklist', ip)
					.exec((err) => {
						if (err) throw err
					})
			})
		} catch (error) {
			console.log(`ERROR BLACKLISTING ${ip}`)
			console.error(error)
		}
	}

	function handleWhitelist(ip: string) {
		try {
			deps.redisClient.watch('blacklist', (err) => {
				if (err) throw err
				deps.redisClient
					.multi()
					.SREM('blacklist', ip)
					.exec((err) => {
						if (err) throw err
					})
			})
		} catch (error) {
			console.log(`ERROR WHITELISTING ${ip}`)
			console.error(error)
		}
	}

	return { handleBlacklist, handleWhitelist }
}

export const redisService = redisServiceFactory({ redisClient })
export const redisEvents = {
	addIPToBlacklist: 'blacklist',
	addIPToWhitelist: 'whitelist'
}

export type RedisService = ReturnType<typeof redisServiceFactory>
export type RedisServiceDependencies = {
	redisClient: RedisClient
}
