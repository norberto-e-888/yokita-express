import { authenticate } from '@yokita/common'
import { UserPlainObject, UserRole } from '../../app/user/typings'
import env from '../../env'

export const adminAuthenticate = authenticate({
	jwtSecret: env.auth.jwtSecretAccessToken,
	jwtIn: 'cookies',
	jwtKeyName: 'jwt',
	decodedJWTUserPropertyKey: 'user',
	isProtected: true,
	ignoreExpirationURLs: ['/auth/refresh'],
	limitToRoles: [UserRole.Admin]
})

export const superadminAuthenticate = authenticate({
	jwtSecret: env.auth.jwtSecretAccessToken,
	jwtIn: 'cookies',
	jwtKeyName: 'jwt',
	decodedJWTUserPropertyKey: 'user',
	isProtected: true,
	ignoreExpirationURLs: ['/auth/refresh'],
	limitToRoles: [UserRole.SuperAdmin]
})

export const endUserAuthenticate = authenticate({
	jwtSecret: env.auth.jwtSecretAccessToken,
	jwtIn: 'cookies',
	jwtKeyName: 'jwt',
	decodedJWTUserPropertyKey: 'user',
	isProtected: true,
	ignoreExpirationURLs: ['/auth/refresh'],
	limitToRoles: [UserRole.EndUser],
	extraCondition: (user: UserPlainObject, req) =>
		!(
			user.is2FALoginOnGoing &&
			![
				'/auth/2fa',
				'/auth/current-user',
				'/auth/refresh',
				'/auth/sign-out'
			].includes(req.originalUrl)
		)
})

export type EndUserAuth = typeof endUserAuthenticate
export type AdminAuth = typeof adminAuthenticate
export type SuperAdminAuth = typeof superadminAuthenticate
