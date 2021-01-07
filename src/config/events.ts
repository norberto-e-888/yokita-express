import { BLACKLIST_EVENTS, blacklistService } from '../app/blacklist'
import { cacheService } from '../app/cache'
import { CACHE_EVENTS } from '../app/cache/service'
import { SMS_EVENTS, smsService } from '../app/sms'
import { eventEmitter } from '../lib'

eventEmitter.on(BLACKLIST_EVENTS.addIPToBlacklist, blacklistService.blacklistIp)
eventEmitter.on(BLACKLIST_EVENTS.addIPToWhitelist, blacklistService.whitelistIp)
eventEmitter.on(SMS_EVENTS.sendVerification, smsService.sendVerification)
eventEmitter.on(SMS_EVENTS.send2FACode, smsService.send2FACode)
eventEmitter.on(
	CACHE_EVENTS.invalidateUserCache,
	cacheService.invalidateUserCache
)
