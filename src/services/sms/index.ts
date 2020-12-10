import { Twilio } from 'twilio'
import { UserDocument, UserPhone } from '../../app/user/typings'
import env from '../../env'
import { twilioClient } from '../../lib'

export const smsServiceFactory = (deps: SmsFactoryDependencies) => {
	async function handleSendVerification(user: UserDocument) {
		try {
			if (!user.phone) return
			const code = await user.setCode('phoneVerificationCode', {
				save: true,
				expiresIn: 1000 * 60 * 60 * 24 * 2
			})

			await _send(user.phone, `Your verification code is ${code}`)
		} catch (error) {
			console.error(error)
		}
	}

	async function _send(to: UserPhone, body: string): Promise<void> {
		try {
			await deps.twilioClient.messages.create({
				to: `${to.prefix}${to.value}`,
				body,
				from: env.twilio.number
			})
		} catch (error) {
			console.error(error)
		}
	}

	return { handleSendVerification }
}

export const smsService = smsServiceFactory({ twilioClient })
export const smsEvents = {
	sendVerification: 'sendPhoneVerification'
}

export type SmsService = ReturnType<typeof smsServiceFactory>
export type SmsFactoryDependencies = {
	twilioClient: Twilio
}
