import { authenticate } from '@yokita/common'
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

export const unauthenticatedOnly = authenticate({
	userModel,
	getCachedUser: cacheService.getCachedUser,
	jwtSecret: env.auth.jwtSecretAccessToken,
	jwtIn: 'cookies',
	jwtKeyName: 'jwt',
	isProtected: false,
	unauthenticatedOnly: true
})()()

export const adminAuthenticate = baseAuthenticate(
	UserRole.Admin,
	UserRole.SuperAdmin
)

export const superadminAuthenticate = baseAuthenticate(UserRole.SuperAdmin)
export const endUserAuthenticate = baseAuthenticate(UserRole.EndUser)
export function isNotInProcessOf2FA(user: UserPlainObject) {
	return !user.is2FALoginOnGoing && !user.isBlocked
}

export function isInProcessOf2FA(user: UserPlainObject) {
	return user.is2FALoginOnGoing && !user.isBlocked
}

export type BaseAuth = typeof baseAuthenticate
export type UnauthOnly = typeof unauthenticatedOnly
export type EndUserAuth = typeof endUserAuthenticate
export type AdminAuth = typeof adminAuthenticate
export type SuperAdminAuth = typeof superadminAuthenticate
