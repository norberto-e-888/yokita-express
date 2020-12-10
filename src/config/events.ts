import { eventEmitter } from '../lib'
import {
	emailEvents,
	emailService,
	redisEvents,
	redisService
} from '../services'

eventEmitter.on(redisEvents.addIPToBlacklist, redisService.handleBlacklist)
eventEmitter.on(
	emailEvents.sendVerfication,
	emailService.handleSendEmailVerification
)
