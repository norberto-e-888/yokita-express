import sendgridClient, { MailDataRequired, MailService } from '@sendgrid/mail'
import { VALID_EMAIL_REGEX } from '../../../constants'
import env from '../../../env'
import { UserDocument, UserPlainObject } from '../../user'

sendgridClient.setApiKey(env.sendgrid.apiKey)

export const emailServiceFactory = (deps: EmailServiceDependencies) => {
	async function sendEmailVerification(
		user: UserDocument | UserPlainObject,
		code: string
	): Promise<void> {
		try {
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
		user: UserDocument | UserPlainObject,
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

	return { sendEmailVerification, sendPasswordResetCode }
}

export default emailServiceFactory({ sendgridClient })
export const EMAIL_EVENTS = {
	sendVerification: 'sendEmailVerification'
}

export type EmailService = ReturnType<typeof emailServiceFactory>
export type EmailServiceDependencies = {
	sendgridClient: MailService
}
