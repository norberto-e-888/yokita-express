import { NextFunction, Request, Response } from 'express'
import { EventEmitter } from 'events'
import bcrypt from 'bcryptjs'
import { ALLOWED_ROLES, COOKIE_OPTIONS } from '../../../constants'
import { BCrypt } from '../../../typings'
import { User, UserRole } from '../../user/typings'
import authService, { AuthService } from '../service'
import { AuthenticationResult, SignUpDto } from '../typings'
import { AppError } from '@yokita/common'
import { eventEmitter, redisClient } from '../../../lib'
import { RedisClient } from 'redis'
import {
	blacklistEvents,
	blacklistService,
	BlacklistService
} from '../../blacklist'

export const authControllerFactory = (deps: AuthControllerDependencies) => {
	async function handleSignUp(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			const authResult = await deps.authService.signUp(req.body, req.ip)
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
			const authResult = await deps.authService.signIn(req.body, req.ip)
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
				req.ip,
				req.body.code
			)

			return _sendAuthenticationResult(res, authResult)
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
				req.body.newPassword as string,
				req.ip
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
				req.cookies.refreshToken,
				req.ip
			)

			return res.status(200).cookie('jwt', newAccessToken, COOKIE_OPTIONS).end()
		} catch (error) {
			handleSignOut(req, res, next)
		}
	}

	function handleGetCurrentUser(req: Request, res: Response): Response | void {
		return res.json(req.user)
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
				deps.eventEmitter.emit(blacklistEvents.addIPToBlacklist, req.ip)
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
		protectRoleSetting,
		checkBlacklist
	}
}

export default authControllerFactory({
	authService,
	bcrypt,
	eventEmitter,
	redisClient,
	blacklistService
})

export type AuthControllerDependencies = {
	authService: AuthService
	bcrypt: BCrypt
	eventEmitter: EventEmitter
	redisClient: RedisClient
	blacklistService: BlacklistService
}

export type AuthController = ReturnType<typeof authControllerFactory>
