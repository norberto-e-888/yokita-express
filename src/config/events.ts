import { blacklistEvents, blacklistService } from '../app/blacklist'
import { cacheService } from '../app/cache'
import { cacheServiceEvents } from '../app/cache/service'
import { emailEvents, emailService } from '../app/email'
import { smsEvents, smsService } from '../app/sms'
import { eventEmitter } from '../lib'

eventEmitter.on(blacklistEvents.addIPToBlacklist, blacklistService.blacklistIp)
eventEmitter.on(blacklistEvents.addIPToWhitelist, blacklistService.whitelistIp)
eventEmitter.on(
	emailEvents.sendVerification,
	emailService.sendEmailVerification
)

eventEmitter.on(smsEvents.sendVerification, smsService.sendVerification)
eventEmitter.on(
	cacheServiceEvents.invalidateUserCache,
	cacheService.invalidateUserCache
)
