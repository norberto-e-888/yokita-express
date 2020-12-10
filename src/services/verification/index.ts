import { UserDocument } from '../../app/user/typings'
import { emailService, EmailService } from '../email'
import { smsService, SmsService } from '../sms'

export const verificationServiceFactory = (
	deps: VerificationServiceDepedencies
) => {
	async function handleSendVerificationCodes(
		user: UserDocument
	): Promise<void> {
		try {
			await deps.emailService.handleSendEmailVerification(user)
			await deps.smsService.handleSendVerification(user)
		} catch (error) {
			console.error(error)
		}
	}

	return { handleSendVerificationCodes }
}

export const verificationService = verificationServiceFactory({
	smsService,
	emailService
})

export const verificationEvents = {
	sendVerificationCodes: 'sendVerificationCodes'
}

export type VerificationService = ReturnType<typeof verificationServiceFactory>
export type VerificationServiceDepedencies = {
	smsService: SmsService
	emailService: EmailService
}
