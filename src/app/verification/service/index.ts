import { emailService, EmailService } from '../../email'
import { smsService, SmsService } from '../../sms'
import { UserDocument } from '../../user'

export const verificationServiceFactory = (
	deps: VerificationServiceDepedencies
) => {
	async function sendVerificationCodes(user: UserDocument): Promise<void> {
		try {
			await deps.emailService.sendEmailVerification(user)
			await deps.smsService.sendVerification(user)
		} catch (error) {
			console.error(error)
		}
	}

	return { sendVerificationCodes }
}

export default verificationServiceFactory({
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
