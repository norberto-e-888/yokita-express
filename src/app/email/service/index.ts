import { MailDataRequired, MailService } from '@sendgrid/mail'
import { VALID_EMAIL_REGEX } from '../../../constants'
import env from '../../../env'
import { logger, sendgridClient } from '../../../lib'
import { UserDocument, UserPlainObject } from '../../user'

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

	async function sendErrorsToAdmin({
		content,
		filename,
		type
	}: EmailAttachment): Promise<void> {
		const promises = env.adminEmails.map((to) =>
			_send({
				to,
				from: env.sendgrid.from,
				subject: 'Boilerplate errors',
				text: 'See attached file',
				attachments: [
					{
						content,
						filename,
						type,
						disposition: 'attachment'
					}
				]
			})
		)

		await Promise.all(promises)
	}

	async function _send(data: MailDataRequired): Promise<void> {
		try {
			if (!VALID_EMAIL_REGEX.test(data.to as string)) {
				throw new Error(`Invalid email ${data.to}`)
			}

			await deps.sendgridClient.send(data)
		} catch (error) {
			logger.error('email.service._send %o', error)
		}
	}

	return { sendEmailVerification, sendPasswordResetCode, sendErrorsToAdmin }
}

export default emailServiceFactory({ sendgridClient })
export const EMAIL_EVENTS = {
	sendVerification: 'sendEmailVerification'
}

export type EmailService = ReturnType<typeof emailServiceFactory>
export type EmailServiceDependencies = {
	sendgridClient: MailService
}

export type EmailAttachment = {
	content: string
	filename: string
	type: string
}
