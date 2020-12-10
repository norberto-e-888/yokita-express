import { eventEmitter } from '../lib'
import {
	emailEvents,
	emailService,
	redisEvents,
	redisService,
	smsEvents,
	smsService,
	verificationService,
	verificationEvents
} from '../services'

eventEmitter.on(redisEvents.addIPToBlacklist, redisService.handleBlacklist)
eventEmitter.on(
	emailEvents.sendVerification,
	emailService.handleSendEmailVerification
)

eventEmitter.on(smsEvents.sendVerification, smsService.handleSendVerification)
eventEmitter.on(
	verificationEvents.sendVerificationCodes,
	verificationService.handleSendVerificationCodes
)
