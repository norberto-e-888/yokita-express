import { NextFunction, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { ALLOWED_ROLES, COOKIE_OPTIONS } from '../../../constants'
import { BCrypt } from '../../../typings'
import { User, UserDocument, UserRole } from '../../user/typings'
import authService, { AuthService } from '../service'
import { AuthenticationResult, SignUpDto } from '../typings'
import { AppError, GenericFunctionalRepository } from '@yokita/common'
import {
	BlacklistJob,
	BlacklistJobsData,
	blacklistQueue,
	BlacklistQueue
} from '../../../lib'
import { RedisClient } from 'redis'
import { blacklistService, BlacklistService } from '../../blacklist'
import { CacheService, redisClient } from '../../cache/service'
import { cacheService } from '../../cache'
import { userRepository } from '../../user'

export const authControllerFactory = (deps: AuthControllerDependencies) => {
	async function handleSignUp(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			const authResult = await deps.authService.signUp(req.body)
			return _sendAuthenticationResult(res, authResult, true)
		} catch (error) {
			return next(error)
		}
	}

	async function handleSignIn(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			const authResult = await deps.authService.signIn(req.body)
			return _sendAuthenticationResult(res, authResult)
		} catch (error) {
			return next(error)
		}
	}

	async function handle2FA(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			const authResult = await deps.authService.twoFactorAuthentication(
				req.user?.id as string,
				req.body.code
			)

			return _sendAuthenticationResult(res, authResult)
		} catch (error) {
			return next(error)
		}
	}

	async function handleToggle2FA(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			const user = await deps.authService.toggle2FA(req.user?.id as string)
			return res.status(200).json(user)
		} catch (error) {
			return next(error)
		}
	}

	async function handleResend2FACode(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			await deps.authService.resend2FACode(req.user?.id as string)
			return res
				.status(200)
				.json(
					`Check ${req.user?.phone?.prefix}-${req.user?.phone?.value} for your 2FA code`
				)
		} catch (error) {
			return next(error)
		}
	}

	async function handleResendVerificationCode(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			const type = req.params.type as 'email' | 'phone'
			await deps.authService.resendVerification(req.user?.id as string, type)
			return res
				.status(200)
				.json(
					type === 'email'
						? `Check ${req.user?.email} for your verification code`
						: `Check ${req.user?.phone?.prefix}-${req.user?.phone?.value} for your verification code`
				)
		} catch (error) {
			return next(error)
		}
	}

	async function handleSignOut(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			await deps.authService.signOut(req.user?.id as string)
			return res
				.clearCookie('jwt', COOKIE_OPTIONS)
				.clearCookie('refreshToken', COOKIE_OPTIONS)
				.end()
		} catch (error) {
			return next(error)
		}
	}

	async function handleVerifyUserInfo(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			const user = await deps.authService.verifyUserInfo(
				req.user?.id as string,
				req.params.info === 'email'
					? 'emailVerificationCode'
					: 'phoneVerificationCode',
				req.params.code as string
			)

			return res.json(user)
		} catch (error) {
			return next(error)
		}
	}

	async function handleRecoverAccount(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			await deps.authService.recoverAccount(
				req.params.info as string,
				req.params.via as 'email' | 'sms'
			)

			return res.send(
				`Check your ${
					req.params.via === 'email' ? 'email' : 'phone'
				} for a password reset code`
			)
		} catch (error) {
			return next(error)
		}
	}

	async function handleResetPasword(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			const authResult = await deps.authService.resetPassword(
				req.params.info as string,
				req.params.via as 'email' | 'sms',
				req.params.code as string,
				req.body.newPassword as string
			)

			return _sendAuthenticationResult(res, authResult)
		} catch (error) {
			return next(error)
		}
	}

	async function handleRefreshAccessToken(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			const isUserBlacklisted = await deps.blacklistService.isUserBlacklisted(
				req.user!.id
			)

			if (isUserBlacklisted) {
				throw new AppError('Blocked', 403)
			}

			const newAccessToken = await deps.authService.refreshAccessToken(
				req.user as User,
				req.cookies.refreshToken
			)

			return res.status(200).cookie('jwt', newAccessToken, COOKIE_OPTIONS).end()
		} catch (error) {
			handleSignOut(req, res, next)
		}
	}

	async function handleGetCurrentUser(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			deps.cacheService.getCachedUser(
				req.user?.id as string,
				async (err, data) => {
					if (err) return next(err)
					if (!!data) {
						return res.json(JSON.parse(data))
					}

					const freshUserFromDB = (await deps.userRepository.findById(
						req.user?.id as string,
						{ failIfNotFound: false }
					)) as UserDocument | undefined

					if (freshUserFromDB) {
						deps.cacheService.cacheUser(freshUserFromDB.toObject(), (err) => {
							if (err) {
								console.error(
									`There was an error caching user with ID: ${req.user?.id}`
								)
							}

							return res.json(freshUserFromDB.toObject())
						})
					} else {
						return next(
							new AppError(`No user with ID ${req.user?.id} was found`, 404)
						)
					}
				}
			)
		} catch (error) {
			return next(error)
		}
	}

	function protectRoleSetting(
		req: Request,
		_: Response,
		next: NextFunction
	): void {
		try {
			const payload: SignUpDto & { role: UserRole } = req.body
			const isUnknownOrForbiddenRoleBeingSet =
				payload.role &&
				!ALLOWED_ROLES.includes(
					payload.role.trim().toLocaleLowerCase() as UserRole
				)

			if (isUnknownOrForbiddenRoleBeingSet) {
				const data: BlacklistJobsData[BlacklistJob.AddIpToBlacklist] = req.ip
				deps.blacklistQueue.add(BlacklistJob.AddIpToBlacklist, data)
				throw new AppError('Perpetually blocked', 403)
			}

			next()
		} catch (error) {
			return next(error)
		}
	}

	async function checkBlacklist(
		req: Request,
		_: Response,
		next: NextFunction
	): Promise<void> {
		try {
			deps.redisClient.sismember(
				'blacklist',
				req.ip,
				(err, isIPInBlacklist: number) => {
					if (err) throw err
					if (!!isIPInBlacklist) {
						return next(new AppError('Perpetually blocked', 403))
					}

					next()
				}
			)
		} catch (error) {
			return next(error)
		}
	}

	function _sendAuthenticationResult(
		res: Response,
		authResult: AuthenticationResult,
		isSignUp = false
	): Response {
		return res
			.status(isSignUp ? 201 : 200)
			.cookie('jwt', authResult.jwt, COOKIE_OPTIONS)
			.cookie('refreshToken', authResult.refreshToken, COOKIE_OPTIONS)
			.json(authResult.user)
	}

	return {
		handleSignUp,
		handleSignIn,
		handleSignOut,
		handleRefreshAccessToken,
		handleGetCurrentUser,
		handleVerifyUserInfo,
		handleResetPasword,
		handleRecoverAccount,
		handle2FA,
		handleResend2FACode,
		handleResendVerificationCode,
		handleToggle2FA,
		protectRoleSetting,
		checkBlacklist
	}
}

export default authControllerFactory({
	authService,
	bcrypt,
	redisClient,
	blacklistService,
	cacheService,
	userRepository,
	blacklistQueue
})

export type AuthControllerDependencies = {
	authService: AuthService
	bcrypt: BCrypt
	redisClient: RedisClient
	blacklistService: BlacklistService
	cacheService: CacheService
	userRepository: GenericFunctionalRepository
	blacklistQueue: BlacklistQueue
}

export type AuthController = ReturnType<typeof authControllerFactory>
