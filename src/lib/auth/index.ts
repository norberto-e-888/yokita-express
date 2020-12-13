import { authenticate } from '@yokita/common'
import { Request } from 'express'
import { cacheService } from '../../app/cache'
import { userModel } from '../../app/user'
import { UserPlainObject, UserRole } from '../../app/user/typings'
import env from '../../env'

export const baseAuthenticate = authenticate({
	userModel,
	getCachedUser: cacheService.getCachedUser,
	jwtSecret: env.auth.jwtSecretAccessToken,
	jwtIn: 'cookies',
	jwtKeyName: 'jwt',
	isProtected: true,
	ignoreExpirationURLs: ['/auth/refresh']
})

export const adminAuthenticate = baseAuthenticate(
	UserRole.Admin,
	UserRole.SuperAdmin
)

export const superadminAuthenticate = baseAuthenticate(UserRole.SuperAdmin)
export const endUserAuthenticate = baseAuthenticate(UserRole.EndUser)(
	isNotInProcessOf2FA
)

export function isNotInProcessOf2FA(user: UserPlainObject, req: Request) {
	return !(
		user.is2FALoginOnGoing &&
		![
			'/auth/2fa',
			'/auth/current-user',
			'/auth/refresh',
			'/auth/sign-out'
		].includes(req.originalUrl)
	)
}

export type BaseAuth = typeof baseAuthenticate
export type EndUserAuth = typeof endUserAuthenticate
export type AdminAuth = typeof adminAuthenticate
export type SuperAdminAuth = typeof superadminAuthenticate
