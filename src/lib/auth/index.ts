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
	ignoreExpirationURLs: ['/auth/refresh']
})

export const unauthenticatedOnly = authenticate({
	jwtSecret: env.auth.jwtSecretAccessToken,
	jwtIn: 'cookies',
	jwtKeyName: 'jwt',
	isProtected: false,
	unauthenticatedOnly: true
})()()

export const populateUser = authenticate({
	userModel,
	getCachedUser: cacheService.getCachedUser,
	jwtSecret: env.auth.jwtSecretAccessToken,
	jwtIn: 'cookies',
	jwtKeyName: 'jwt',
	isProtected: false
})()()

export const superadminAuthenticate = baseAuthenticate(UserRole.SuperAdmin)
export const adminAuthenticate = baseAuthenticate(
	UserRole.Admin,
	UserRole.SuperAdmin
)

export const endUserAuthenticate = baseAuthenticate(
	UserRole.EndUser,
	UserRole.Admin,
	UserRole.SuperAdmin
)

export function isNotInProcessOf2FA(user: UserPlainObject) {
	return !user.is2FALoginOnGoing
}

export function isInProcessOf2FA(user: UserPlainObject) {
	return user.is2FALoginOnGoing
}

export function isNotBlocked(user: UserPlainObject) {
	return !user.isBlocked
}

export type BaseAuth = typeof baseAuthenticate
export type UnauthOnly = typeof unauthenticatedOnly
export type EndUserAuth = typeof endUserAuthenticate
export type AdminAuth = typeof adminAuthenticate
export type SuperAdminAuth = typeof superadminAuthenticate
