import { emailService, EmailService } from '../../email'
import { smsService, SmsService } from '../../sms'
import { UserDocument } from '../../user'

export const verificationServiceFactory = (
	deps: VerificationServiceDepedencies
) => {
	async function sendVerificationCodes(user: UserDocument): Promise<void> {
		try {
			const emailCode = await user.setCode('emailVerificationCode', {
				save: false
			})

			const smsCode = await user.setCode('phoneVerificationCode', {
				save: false
			})

			await user.save({ validateBeforeSave: false })
			await deps.emailService.sendEmailVerification(user, emailCode)
			await deps.smsService.sendVerification(user, smsCode)
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
