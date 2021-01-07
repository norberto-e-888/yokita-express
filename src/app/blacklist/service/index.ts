import { RedisClient } from 'redis'
import { EventEmitter } from 'events'
import { eventEmitter } from '../../../lib'
import { BlacklistEntryCreateDTO, BlacklistEntryModel } from '../typings'
import { blacklistModel } from '..'
import { UserDocument, UserModel } from '../../user/typings'
import { ClientSession } from 'mongoose'
import { userModel, userRepository } from '../../user'
import { GenericFunctionalRepository } from '@yokita/common'
import { redisClient } from '../../cache/service'

export const blacklistServiceFactory = (deps: BlacklistServiceDependencies) => {
	function blacklistIp(ip: string) {
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

	function whitelistIp(ip: string) {
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

	async function blacklistUser(userId: string, ip: string): Promise<void> {
		const session = await deps.userModel.db.startSession()
		try {
			await session.withTransaction(
				async () => {
					const user = (await deps.userRepository.findById(
						userId
					)) as UserDocument

					const isUserAlreadyBlacklisted = await isUserBlacklisted(userId)
					if (isUserAlreadyBlacklisted) {
						await _addKnownIPOfBlacklistedUser(userId, ip, session)
					} else {
						user.isBlocked = true
						await user.save({ session })
						await deps.blacklistModel.create<BlacklistEntryCreateDTO>(
							{
								user: user.id,
								ips: [ip]
							},
							{ session }
						)
					}
				},
				{
					readPreference: 'primary',
					readConcern: { level: 'local' },
					writeConcern: { w: 'majority' }
				}
			)
		} catch (error) {
			console.log(
				`ERROR BLACKLISTING KNOWN USER OF ID: ${userId} and IP: ${ip}`
			)

			console.error(error)
		} finally {
			session.endSession()
		}
	}

	async function isUserBlacklisted(user: string): Promise<boolean> {
		return !!(await deps.blacklistModel.findOne({ user }))
	}

	async function _addKnownIPOfBlacklistedUser(
		userId: string,
		ip: string,
		session?: ClientSession
	): Promise<void> {
		await deps.blacklistModel.findOneAndUpdate(
			{ user: userId },
			{ $addToSet: { ips: ip } },
			{ session }
		)
	}

	return { blacklistIp, whitelistIp, isUserBlacklisted, blacklistUser }
}

export default blacklistServiceFactory({
	redisClient,
	eventEmitter,
	blacklistModel,
	userModel,
	userRepository
})

export const BLACKLIST_EVENTS = {
	addIPToBlacklist: 'blacklist',
	addIPToWhitelist: 'whitelist'
}

export type BlacklistService = ReturnType<typeof blacklistServiceFactory>
export type BlacklistServiceDependencies = {
	redisClient: RedisClient
	eventEmitter: EventEmitter
	blacklistModel: BlacklistEntryModel
	userModel: UserModel
	userRepository: GenericFunctionalRepository
}
