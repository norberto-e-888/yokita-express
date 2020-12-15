import {
	AppError,
	generateCode,
	GenericFunctionalRepository
} from '@yokita/common'
import jwt from 'jsonwebtoken'
import { EventEmitter } from 'events'
import bcrypt from 'bcryptjs'
import env from '../../../env'
import { BCrypt, GenerateCode, JWT } from '../../../typings'
import { userRepository } from '../../user'
import {
	User,
	UserDocument,
	UserModel,
	UserPlainObject
} from '../../user/typings'
import {
	AccessTokenPayload,
	AuthenticationResult,
	RefreshTokenPayload,
	SignInDto,
	SignUpDto
} from '../typings'
import userModel from '../../user/model'
import blacklistModel from '../../blacklist/model'
import { BlacklistEntryModel } from '../../blacklist/typings'
import { eventEmitter } from '../../../lib'
import { SMS_EVENTS } from '../../sms'
import { EMAIL_EVENTS } from '../../email'
import { CACHE_EVENTS } from '../../cache/service'

export const authServiceFactory = (deps: AuthServiceDependencies) => {
	async function signUp(
		signUpDto: SignUpDto,
		ipAddress: string
	): Promise<AuthenticationResult> {
		await deps.userModel.isEmailInUse(signUpDto.email)
		const newUser = (await deps.userRepository.create<SignUpDto>(signUpDto, {
			returnPlainObject: false
		})) as UserDocument

		const authResult = await _generateAuthenticationResult(newUser, ipAddress)
		return authResult
	}

	async function signIn(
		credentials: SignInDto,
		ipAddress: string
	): Promise<AuthenticationResult> {
		const user = await deps.userModel.findOne({
			email: credentials.email
		})

		if (!user) {
			throw new AppError('Invalid credentials.', 401)
		}

		if (user.isBlocked) {
			throw new AppError('Blocked', 403)
		}

		await user.isPasswordValid(credentials.password, { throwIfInvalid: true })
		if (user.is2FAEnabled && user.phone) {
			const code = await user.setCode('twoFactorAuthCode', {
				save: false,
				expiresIn: 1000 * 60 * 60 * 6
			})

			user.is2FALoginOnGoing = true
			await user.save({ validateModifiedOnly: true })
			deps.eventEmitter.emit(SMS_EVENTS.send2FACode, user, code)
		} else {
			user.is2FALoginOnGoing = false
			await user.save({ validateModifiedOnly: true })
		}

		return await _generateAuthenticationResult(user, ipAddress)
	}

	async function resend2FACode(userId: string): Promise<void> {
		const user = (await deps.userRepository.findById(userId, {
			failIfNotFound: true
		})) as UserDocument

		if (!user.is2FALoginOnGoing) {
			throw new AppError('You are not in process of login', 400)
		}

		const code = await user.setCode('twoFactorAuthCode', {
			save: true,
			expiresIn: 1000 * 60 * 60 * 6
		})

		deps.eventEmitter.emit(SMS_EVENTS.send2FACode, user, code)
	}

	async function resendVerification(
		userId: string,
		type: 'email' | 'phone'
	): Promise<void> {
		const user = (await deps.userRepository.findById(userId, {
			failIfNotFound: true
		})) as UserDocument

		await user.sendVerification(type, true)
	}

	async function twoFactorAuthentication(
		userId: string,
		ipAddress: string,
		triedCode: string
	): Promise<AuthenticationResult> {
		const user = (await deps.userRepository.findById(userId, {
			failIfNotFound: true
		})) as UserDocument

		if (!user.is2FALoginOnGoing) {
			throw new AppError('You are not in process of login', 400)
		}

		const { isValid, isExpired } = await user.isCodeValid(
			'twoFactorAuthCode',
			triedCode,
			{
				ignoreExpiration: true
			}
		)

		if (isExpired) {
			user.twoFactorAuthCode = undefined
			user.is2FALoginOnGoing = false
			user.refreshToken = undefined
			await user.save({ validateModifiedOnly: true })
			throw new AppError('Expired 2FA token', 400)
		}

		if (!isValid) {
			throw new AppError('Wrong 2FA code', 400)
		}

		user.twoFactorAuthCode = undefined
		user.is2FALoginOnGoing = false
		await user.save({ validateModifiedOnly: true })
		return await _generateAuthenticationResult(user, ipAddress)
	}

	async function signOut(userId: string): Promise<void> {
		await deps.userModel.findByIdAndUpdate(userId, {
			refreshToken: undefined,
			twoFactorAuthCode: undefined,
			is2FALoginOnGoing: false
		})

		deps.eventEmitter.emit(CACHE_EVENTS.invalidateUserCache, userId)
	}

	async function refreshAccessToken(
		user: User,
		refreshToken: string,
		ipAddress: string
	): Promise<string> {
		const userDocument = (await deps.userRepository.findById(user.id, {
			failIfNotFound: true
		})) as UserDocument

		if (!userDocument.refreshToken) {
			throw new AppError('Unauthenticated.', 401)
		}

		const isTokenValid = await deps.bcrypt.compare(
			refreshToken,
			userDocument.refreshToken
		)

		if (!isTokenValid) {
			throw new AppError('Unauthenticated.', 401)
		}

		const payload = deps.jwt.verify(
			refreshToken,
			env.auth.jwtSecretRefreshToken
		) as RefreshTokenPayload

		if (payload.ip !== ipAddress) {
			throw new AppError('Unauthenticated.', 401)
		}

		return _generateAccessToken({
			id: userDocument.id
		})
	}

	async function toggle2FA(userId: string): Promise<UserPlainObject> {
		const user = (await deps.userRepository.findById(userId, {
			failIfNotFound: true
		})) as UserDocument

		if (user.is2FAEnabled) {
			user.is2FAEnabled = false
			await user.save({ validateModifiedOnly: true })
			return user.toObject()
		}

		if (!user.isPhoneVerified) {
			throw new AppError('Your phone must be verified to enable 2FA', 403)
		}

		user.is2FAEnabled = true
		await user.save({ validateModifiedOnly: true })
		return user.toObject()
	}

	async function verifyUserInfo(
		userId: string,
		propertyToVerify: 'phoneVerificationCode' | 'emailVerificationCode',
		triedCode: string
	): Promise<UserDocument> {
		const user = (await deps.userRepository.findById(userId, {
			failIfNotFound: true
		})) as UserDocument

		if (user.isPhoneVerified && propertyToVerify === 'phoneVerificationCode') {
			throw new AppError('Your phone is already verified', 400)
		}

		if (user.isEmailVerified && propertyToVerify === 'emailVerificationCode') {
			throw new AppError('Your email is already verified', 400)
		}

		const verifiedUser = await user.verifyInfo(triedCode, propertyToVerify, {
			throwIfInvalid: true
		})

		return verifiedUser.toObject()
	}

	async function recoverAccount(
		info: string,
		via: 'sms' | 'email'
	): Promise<void> {
		const criteria =
			via === 'sms'
				? {
						'phone.prefix': info.split('-')[0],
						'phone.value': info.split('-')[1]
				  }
				: { email: info }

		const user = await deps.userModel.findOne(criteria)
		if (!user) {
			throw new AppError('We could not find an account', 404)
		}

		const code = await user.setCode('passwordResetCode', {
			save: true,
			expiresIn: 1000 * 60 * 60 * 24 * 2
		})

		if (via === 'email') {
			deps.eventEmitter.emit(EMAIL_EVENTS.sendVerification, user, code)
		} else {
			deps.eventEmitter.emit(SMS_EVENTS.sendVerification, user, code)
		}
	}

	async function resetPassword(
		info: string,
		via: 'sms' | 'email',
		triedCode: string,
		newPassword: string,
		ip: string
	): Promise<AuthenticationResult> {
		const criteria =
			via === 'sms'
				? {
						'phone.prefix': info.split('-')[0],
						'phone.value': info.split('-')[1]
				  }
				: { email: info }

		const user = await deps.userModel.findOne(criteria)
		if (!user) {
			throw new AppError('We could not find an account', 404)
		}

		const resetUser = await user.resetPassword(triedCode, newPassword)
		if (!resetUser) {
			throw new AppError('You did not ask for a password reset code', 400)
		}

		return _generateAuthenticationResult(user, ip)
	}

	async function _generateAuthenticationResult(
		userDocument: UserDocument,
		ip: string
	): Promise<AuthenticationResult> {
		const user = userDocument
		const refreshTokenPayload: RefreshTokenPayload = { ip }
		const refreshToken = _generateRefreshToken(refreshTokenPayload)
		user.refreshToken = await deps.bcrypt.hash(refreshToken, 6)
		await user.save({ validateModifiedOnly: true })
		const authenticationToken = _generateAccessToken({
			id: user.id
		})

		return {
			user: user.toObject(),
			jwt: authenticationToken,
			refreshToken
		}
	}

	function _generateAccessToken(payload: AccessTokenPayload): string {
		return deps.jwt.sign(payload, env.auth.jwtSecretAccessToken, {
			expiresIn: 60 * 15
		})
	}

	function _generateRefreshToken(payload: RefreshTokenPayload): string {
		return deps.jwt.sign(payload, env.auth.jwtSecretRefreshToken, {
			expiresIn: '365 days'
		})
	}

	return {
		signUp,
		signIn,
		signOut,
		refreshAccessToken,
		resetPassword,
		verifyUserInfo,
		twoFactorAuthentication,
		recoverAccount,
		toggle2FA,
		resend2FACode,
		resendVerification
	}
}

export default authServiceFactory({
	userRepository,
	userModel,
	jwt,
	bcrypt,
	blacklistModel,
	eventEmitter,
	generateCode
})

export type AuthService = ReturnType<typeof authServiceFactory>
export interface AuthServiceDependencies {
	userRepository: GenericFunctionalRepository
	userModel: UserModel
	jwt: JWT
	bcrypt: BCrypt
	blacklistModel: BlacklistEntryModel
	eventEmitter: EventEmitter

	generateCode: GenerateCode
}
