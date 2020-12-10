import { AppError, generateCode } from '@yokita/common'
import brcrypt from 'bcryptjs'
import { UserMethodIsPasswordValid, UserMethodSetCode } from '../typings'

export const setCode: UserMethodSetCode = async function (
	property,
	{ save = true, expiresIn = 1000 * 60 * 60 }
) {
	const code = generateCode(6, { posibilidadesIguales: true, chars: 'Aa#' })
	const codeHash = await brcrypt.hash(code, 4)
	this[property] = {
		value: codeHash,
		expiration: new Date(Date.now() + expiresIn)
	}

	if (save) {
		await this.save({ validateBeforeSave: false })
	}

	return code
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
