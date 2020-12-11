import { AppError, GenericFunctionalRepository } from '@yokita/common'
import jwt from 'jsonwebtoken'
import { EventEmitter } from 'events'
import bcrypt from 'bcryptjs'
import env from '../../../env'
import { BCrypt, JWT } from '../../../typings'
import { userRepository } from '../../user'
import { User, UserDocument, UserModel } from '../../user/typings'
import {
	AuthenticationResult,
	RefreshTokenPayload,
	SignInDto,
	SignUpDto
} from '../typings'
import userModel from '../../user/model'
import blacklistModel from '../../blacklist/model'
import { BlacklistEntryModel } from '../../blacklist/typings'
import { eventEmitter } from '../../../lib'
import { SmsService, smsService } from '../../sms'
import { EmailService, emailService } from '../../email'
import { verificationEvents } from '../../verification'

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
		deps.eventEmitter.emit(verificationEvents.sendVerificationCodes, newUser)
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

		await user.isPasswordValid(credentials.password, { throwIfInvalid: true })
		return await _generateAuthenticationResult(user, ipAddress)
	}

	async function signOut(userId: string): Promise<void> {
		await deps.userModel.findByIdAndUpdate(userId, {
			refreshToken: undefined
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
			throw new AppError('Invalid user', 400)
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

	return {
		signUp,
		signIn,
		signOut,
		refreshAccessToken,
		resetPassword,
		verifyUserInfo,
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
	emailService
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
}
