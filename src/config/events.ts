import { cacheService } from '../app/cache'
import { CACHE_EVENTS } from '../app/cache/service'
import { SMS_EVENTS, smsService } from '../app/sms'
import { eventEmitter } from '../lib'

eventEmitter.on(SMS_EVENTS.sendVerification, smsService.sendVerification)
eventEmitter.on(SMS_EVENTS.send2FACode, smsService.send2FACode)
eventEmitter.on(
	CACHE_EVENTS.invalidateUserCache,
	cacheService.invalidateUserCache
)
