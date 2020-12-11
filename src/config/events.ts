import { blacklistEvents, blacklistService } from '../app/blacklist'
import { emailEvents, emailService } from '../app/email'
import { smsEvents, smsService } from '../app/sms'
import { verificationEvents, verificationService } from '../app/verification'
import { eventEmitter } from '../lib'

eventEmitter.on(blacklistEvents.addIPToBlacklist, blacklistService.blacklistIp)
eventEmitter.on(blacklistEvents.addIPToWhitelist, blacklistService.whitelistIp)
eventEmitter.on(
	emailEvents.sendVerification,
	emailService.sendEmailVerification
)

eventEmitter.on(smsEvents.sendVerification, smsService.sendVerification)
eventEmitter.on(
	verificationEvents.sendVerificationCodes,
	verificationService.sendVerificationCodes
)
