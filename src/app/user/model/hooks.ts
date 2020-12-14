import { MongooseInstanceHook } from '@yokita/common'
import brcrypt from 'bcryptjs'
import { eventEmitter } from '../../../lib'
import { cacheService } from '../../cache'
import { EMAIL_EVENTS } from '../../email'
import { SMS_EVENTS } from '../../sms'
import { UserDocument } from '../typings'

export const handlePreSave: MongooseInstanceHook<UserDocument> = async function (
	next
) {
	if (this.isModified('password')) {
		this.password = await brcrypt.hash(this.password, 8)
	}

	if (this.isModified('phone') && this.phone) {
		this.isPhoneVerified = false
		this.is2FAEnabled = false
		const smsCode = await this.setCode('phoneVerificationCode', {
			save: false,
			expiresIn: 1000 * 60 * 60 * 24 * 2
		})

		eventEmitter.emit(SMS_EVENTS.sendVerification, this, smsCode)
	}

	if (this.isModified('email')) {
		this.isEmailVerified = false
		const emailCode = await this.setCode('emailVerificationCode', {
			save: false,
			expiresIn: 1000 * 60 * 60 * 24 * 2
		})

		eventEmitter.emit(EMAIL_EVENTS.sendVerification, this, emailCode)
	}

	if (this.isModified()) {
		cacheService.cacheUser(this.toObject(), (err) => {
			if (err) {
				cacheService.invalidateUserCache(this.id)
			}
		})
	}

	next()
}
