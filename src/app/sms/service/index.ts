import { Twilio } from 'twilio'
import env from '../../../env'
import { logger, twilioClient } from '../../../lib'
import { UserDocument, UserPhone, UserPlainObject } from '../../user'

export const smsServiceFactory = (deps: SmsFactoryDependencies) => {
	async function sendVerification(
		user: UserDocument | UserPlainObject,
		code: string
	) {
		try {
			if (!user.phone) return
			await _send(
				user.phone,
				`Your verification code for Boilerplate is ${code}`
			)
		} catch (error) {
			console.error(error)
		}
	}

	async function sendPasswordResetCode(
		user: UserDocument | UserPlainObject,
		code: string
	): Promise<void> {
		if (!user.phone) return
		await _send(
			user.phone,
			`Your account recovery code for your Boilerplate account is ${code}`
		)
	}

	async function send2FACode(
		user: UserDocument | UserPlainObject,
		code: string
	): Promise<void> {
		if (!user.phone) return
		await _send(user.phone, `Your 2FA code is ${code}`)
	}

	async function _send(to: UserPhone, body: string): Promise<void> {
		try {
			await deps.twilioClient.messages.create({
				to: `${to.prefix}${to.value}`,
				body,
				from: env.twilio.number
			})
		} catch (error) {
			logger.error('sms.service._send %o', error)
		}
	}

	return { sendVerification, sendPasswordResetCode, send2FACode }
}

export default smsServiceFactory({ twilioClient })
export const SMS_EVENTS = {
	sendVerification: 'sendPhoneVerification',
	send2FACode: 'send2FACode'
}

export type SmsService = ReturnType<typeof smsServiceFactory>
export type SmsFactoryDependencies = {
	twilioClient: Twilio
}
