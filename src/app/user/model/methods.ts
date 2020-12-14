import { AppError, generateCode } from '@yokita/common'
import brcrypt from 'bcryptjs'
import { eventEmitter } from '../../../lib'
import { EMAIL_EVENTS } from '../../email'
import { SMS_EVENTS } from '../../sms'
import {
	UserMethodIsPasswordValid,
	UserMethodSetCode,
	UserMethodResetPassword,
	UserMethodVerifyInfo,
	UserMethodIsCodeValid,
	UserMethodSendVerification
} from '../typings'

export const setCode: UserMethodSetCode = async function (
	property,
	{ save = true, expiresIn = 1000 * 60 * 60, session }
) {
	const code = generateCode(6, { posibilidadesIguales: true, chars: 'Aa#' })
	const codeHash = await brcrypt.hash(code, 4)
	this[property] = {
		value: codeHash,
		expiration: new Date(Date.now() + expiresIn)
	}

	if (save || session) {
		await this.save({ validateBeforeSave: false, session })
	}

	return code
}

export const isCodeValid: UserMethodIsCodeValid = async function (
	code,
	triedCode,
	{ ignoreExpiration = false }: { ignoreExpiration?: boolean } = {
		ignoreExpiration: false
	}
) {
	if (!this[code]) {
		throw new AppError('Invalid user', 500)
	}

	if (
		!ignoreExpiration &&
		(this[code]?.expiration?.getTime() as number) < Date.now()
	) {
		throw new AppError('Code expired', 400)
	}

	return {
		isValid: await brcrypt.compare(triedCode, this[code]?.value as string),
		isExpired: (this[code]?.expiration?.getTime() as number) < Date.now()
	}
}

export const isPasswordValid: UserMethodIsPasswordValid = async function (
	triedPassword: string,
	options
) {
	const isValid = await brcrypt.compare(triedPassword, this.password)
	if (!isValid && options.throwIfInvalid) {
		throw new AppError('Invalid credentials.', 403)
	}

	return isValid
}

export const verifyInfo: UserMethodVerifyInfo = async function (
	triedCode,
	info,
	options
) {
	const code = this[info]
	if (!code) {
		throw new AppError('Invalid user', 400)
	}

	if (code.expiration.getTime() < Date.now()) {
		throw new AppError('Code expired', 400)
	}

	const isCodeValid = await brcrypt.compare(triedCode, code.value)
	if (isCodeValid) {
		const propertyToUpdate =
			info === 'phoneVerificationCode' ? 'isPhoneVerified' : 'isEmailVerified'

		this[propertyToUpdate] = true
		this[info] = undefined
		await this.save({ validateBeforeSave: false })
	}

	if (!isCodeValid && options?.throwIfInvalid) {
		throw new AppError('Invalid code', 403)
	}

	return this
}

export const resetPassword: UserMethodResetPassword = async function (
	triedCode,
	newPassword
) {
	if (!this.passwordResetCode) return
	if (this.passwordResetCode.expiration.getTime() < Date.now()) {
		throw new AppError('Expired code', 400)
	}

	const isCodeValid = await brcrypt.compare(
		triedCode,
		this.passwordResetCode.value
	)

	if (isCodeValid) {
		this.password = newPassword
		this.passwordResetCode = undefined
		await this.save()
		return this
	} else {
		throw new AppError('Invalid code', 403)
	}
}

export const sendVerification: UserMethodSendVerification = async function (
	type,
	save = false
) {
	if (type === 'email') {
		if (this.isEmailVerified) {
			throw new AppError('Your email is already verified', 400)
		}

		this.isEmailVerified = false
		const emailCode = await this.setCode('emailVerificationCode', {
			save,
			expiresIn: 1000 * 60 * 60 * 24 * 2
		})

		eventEmitter.emit(EMAIL_EVENTS.sendVerification, this, emailCode)
	} else {
		if (!this.phone) {
			throw new AppError('You do not have a phone number to verify', 400)
		}

		if (this.isPhoneVerified) {
			throw new AppError('Your phone is already verified', 400)
		}

		this.isPhoneVerified = false
		this.is2FAEnabled = false
		const smsCode = await this.setCode('phoneVerificationCode', {
			save,
			expiresIn: 1000 * 60 * 60 * 24 * 2
		})

		eventEmitter.emit(SMS_EVENTS.sendVerification, this, smsCode)
	}
}
