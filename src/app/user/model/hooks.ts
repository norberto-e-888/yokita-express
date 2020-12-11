import { MongooseInstanceHook } from '@yokita/common'
import brcrypt from 'bcryptjs'
import { emailService } from '../../email'
import { smsService } from '../../sms'
import { UserDocument } from '../typings'

export const handlePreSave: MongooseInstanceHook<UserDocument> = async function (
	next
) {
	if (this.isModified('password')) {
		this.password = await brcrypt.hash(this.password, 8)
	}

	if (this.isModified('phone')) {
		this.isPhoneVerified = false
		const smsCode = await this.setCode('phoneVerificationCode', {
			save: false
		})

		smsService.sendVerification(this, smsCode)
	}

	if (this.isModified('email')) {
		this.isEmailVerified = false
		const emailCode = await this.setCode('emailVerificationCode', {
			save: false
		})

		emailService.sendEmailVerification(this, emailCode)
	}

	next()
}
