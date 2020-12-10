import { MailDataRequired, MailService } from '@sendgrid/mail'
import { UserDocument } from '../../app/user/typings'
import { VALID_EMAIL_REGEX } from '../../constants'
import env from '../../env'
import { sendgridClient } from '../../lib'

export const emailServiceFactory = (deps: EmailServiceDependencies) => {
	async function handleSendEmailVerification(
		user: UserDocument
	): Promise<void> {
		try {
			const code = await user.setCode('emailVerificationCode', {
				save: true,
				expiresIn: 1000 * 60 * 60 * 24 * 2
			})

			await _send({
				to: user.email,
				from: env.sendgrid.from,
				text: `Your verification code is ${code}`,
				subject: 'Boilerplate verification code'
			})
		} catch (error) {
			console.error(error)
		}
	}

	async function sendPasswordResetCode(
		user: UserDocument,
		code: string
	): Promise<void> {
		await _send({
			to: user.email,
			from: env.sendgrid.from,
			text: `Your account recovery code is ${code}`,
			subject: 'Boilerplate password reset'
		})
	}

	async function _send(data: MailDataRequired): Promise<void> {
		try {
			if (!VALID_EMAIL_REGEX.test(data.to as string)) {
				throw new Error(`Invalid email ${data.to}`)
			}

			await deps.sendgridClient.send(data)
		} catch (error) {
			console.error(error)
		}
	}

	return { handleSendEmailVerification, sendPasswordResetCode }
}

export const emailService = emailServiceFactory({ sendgridClient })
export const emailEvents = {
	sendVerification: 'sendEmailVerification'
}

export type EmailService = ReturnType<typeof emailServiceFactory>
export type EmailServiceDependencies = {
	sendgridClient: MailService
}
