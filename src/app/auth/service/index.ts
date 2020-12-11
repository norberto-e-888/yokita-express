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
import { User, UserDocument, UserModel } from '../../user/typings'
import {
	AuthenticationResult,
	RefreshTokenPayload,
	SignInDto,
	SignUpDto,
	TwoFactorAuthTokenPayload
} from '../typings'
import userModel from '../../user/model'
import blacklistModel from '../../blacklist/model'
import { BlacklistEntryModel } from '../../blacklist/typings'
import { eventEmitter } from '../../../lib'
import { SmsService, smsService } from '../../sms'
import { EmailService, emailService } from '../../email'

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
			const code = deps.generateCode(6, {
				posibilidadesIguales: true,
				chars: 'aA#!'
			})

			const twoFactorAuthToken = _generate2FAToken({ ip: ipAddress, code })
			user.twoFactorAuthToken = twoFactorAuthToken
			user.is2FALoginOnGoing = true
			await user.save({ validateBeforeSave: false })
			await deps.smsService.send2FACode(user, code)
		} else {
			user.is2FALoginOnGoing = false
			await user.save({ validateBeforeSave: false })
		}

		return await _generateAuthenticationResult(user, ipAddress)
	}

	async function twoFactorAuthentication(
		userId: string,
		ipAddress: string,
		triedCode: string
	): Promise<AuthenticationResult> {
		const user = (await deps.userRepository.findById(userId, {
			failIfNotFound: true
		})) as UserDocument

		if (!user.twoFactorAuthToken || !user.is2FALoginOnGoing) {
			throw new AppError('Invalid user', 400)
		}

		const decodedToken = deps.jwt.verify(
			user.twoFactorAuthToken,
			env.auth.jwtSecret2FA,
			{ ignoreExpiration: true }
		) as TwoFactorAuthTokenPayload & { exp: number }

		if (decodedToken.ip !== ipAddress) {
			user.twoFactorAuthToken = undefined
			user.refreshToken = undefined
			user.is2FALoginOnGoing = false
			await user.save({ validateBeforeSave: false })
			throw new AppError('Invalid request', 403)
		}

		if (decodedToken.exp * 1000 < Date.now()) {
			user.twoFactorAuthToken = undefined
			user.refreshToken = undefined
			user.is2FALoginOnGoing = false
			await user.save({ validateBeforeSave: false })
			throw new AppError('Expired 2FA token', 400)
		}

		if (triedCode !== decodedToken.code) {
			throw new AppError('Wrong 2FA code', 400)
		}

		user.twoFactorAuthToken = undefined
		user.is2FALoginOnGoing = false
		user.isPhoneVerified = true
		user.phoneVerificationCode = undefined
		await user.save({ validateBeforeSave: false })
		return await _generateAuthenticationResult(user, ipAddress)
	}

	async function signOut(userId: string): Promise<void> {
		await deps.userModel.findByIdAndUpdate(userId, {
			refreshToken: undefined,
			twoFactorAuthToken: undefined,
			is2FALoginOnGoing: false
		})
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

		return _generateAccessToken(userDocument.toObject())
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
			await deps.emailService.sendPasswordResetCode(user, code)
		} else {
			await deps.smsService.sendPasswordResetCode(user, code)
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
		user.refreshToken = await deps.bcrypt.hash(refreshToken, 8)
		await user.save({ validateBeforeSave: false })
		const authenticationToken = _generateAccessToken(user.toObject())
		return {
			user: user.toObject(),
			jwt: authenticationToken,
			refreshToken
		}
	}

	function _generateAccessToken(user: User): string {
		return deps.jwt.sign({ user }, env.auth.jwtSecretAccessToken, {
			expiresIn: 60 * 15
		})
	}

	function _generateRefreshToken(payload: RefreshTokenPayload): string {
		return deps.jwt.sign(payload, env.auth.jwtSecretRefreshToken, {
			expiresIn: '365 days'
		})
	}

	function _generate2FAToken(payload: TwoFactorAuthTokenPayload): string {
		return deps.jwt.sign(payload, env.auth.jwtSecret2FA, {
			expiresIn: 60 * 60 * 6
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
		recoverAccount
	}
}

export default authServiceFactory({
	userRepository,
	userModel,
	jwt,
	bcrypt,
	blacklistModel,
	eventEmitter,
	smsService,
	emailService,
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
	smsService: SmsService
	emailService: EmailService
	generateCode: GenerateCode
}
