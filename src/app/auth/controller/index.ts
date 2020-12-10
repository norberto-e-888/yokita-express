import { NextFunction, Request, Response } from 'express'
import { EventEmitter } from 'events'
import bcrypt from 'bcryptjs'
import { ALLOWED_ROLES, COOKIE_OPTIONS } from '../../../constants'
import { BCrypt } from '../../../typings'
import { User, UserRole } from '../../user/typings'
import { authService, AuthService } from '../service'
import { AuthenticationResult, SignUpDto } from '../typings'
import { AppError } from '@yokita/common'
import { eventEmitter, redisClient } from '../../../lib'
import { redisEvents } from '../../../services'
import { RedisClient } from 'redis'

export const authControllerFactory = (deps: AuthControllerDependencies) => {
	async function handleSignUp(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			console.log(req.body)
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

	async function handleRefreshAccessToken(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			const isUserBlacklisted = await deps.authService.isUserBlacklisted(
				req.user!.id
			)

			if (isUserBlacklisted) {
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
			const payload: SignUpDto = req.body
			const isUnknownOrForbiddenRoleBeingSet =
				payload.role &&
				!ALLOWED_ROLES.includes(
					payload.role.trim().toLocaleLowerCase() as UserRole
				)

			if (isUnknownOrForbiddenRoleBeingSet) {
				deps.eventEmitter.emit(redisEvents.addIPToBlacklist, req.ip)
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
		protectRoleSetting,
		checkBlacklist
	}
}

export const authController = authControllerFactory({
	authService,
	bcrypt,
	eventEmitter,
	redisClient
})

export type AuthControllerDependencies = {
	authService: AuthService
	bcrypt: BCrypt
	eventEmitter: EventEmitter
	redisClient: RedisClient
}

export type AuthController = ReturnType<typeof authControllerFactory>
