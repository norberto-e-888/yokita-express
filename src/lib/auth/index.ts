import { authenticate } from '@yokita/common'
import { ExtraCondition } from '@yokita/common/build/middleware/authenticate'
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

export function isNotInProcessOf2FA(user: UserPlainObject): boolean {
	return !user.is2FALoginOnGoing
}

export function isInProcessOf2FA(user: UserPlainObject): boolean {
	return user.is2FALoginOnGoing
}

export function isNotBlocked(user: UserPlainObject): boolean {
	return !user.isBlocked
}

export function isPhoneVerified(user: UserPlainObject): boolean {
	return user.isPhoneVerified
}

export const isVerificationRequestNotRedundant: ExtraCondition = (
	user: UserPlainObject,
	req
) => {
	if (req.params.info === 'phone' && user.isPhoneVerified) {
		return false
	}

	if (req.params.info === 'email' && user.isEmailVerified) {
		return false
	}

	return true
}

export const isVerificationResendRequestNotRedundantOrInvalid: ExtraCondition = (
	user: UserPlainObject,
	req
) => {
	const type = req.params.type as 'email' | 'phone'
	if (type === 'email' && user.isEmailVerified) return false
	if (type === 'phone' && (user.isPhoneVerified || !user.phone)) return false
	return true
}

export type BaseAuth = typeof baseAuthenticate
export type UnauthOnly = typeof unauthenticatedOnly
export type EndUserAuth = typeof endUserAuthenticate
export type AdminAuth = typeof adminAuthenticate
export type SuperAdminAuth = typeof superadminAuthenticate
