import { authenticate } from '@yokita/common'
import { UserRole } from '../../app/user/typings'
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

export const endUserAuthenticate = authenticate({
	jwtSecret: env.auth.jwtSecretAccessToken,
	jwtIn: 'cookies',
	jwtKeyName: 'jwt',
	decodedJWTUserPropertyKey: 'user',
	isProtected: true,
	ignoreExpirationURLs: ['/auth/refresh'],
	limitToRoles: [UserRole.Customer, UserRole.Company]
})

export const populateUser = authenticate({
	jwtSecret: env.auth.jwtSecretAccessToken,
	jwtIn: 'cookies',
	jwtKeyName: 'jwt',
	decodedJWTUserPropertyKey: 'user',
	isProtected: false
})

export type AuthenticateMiddleware = ReturnType<typeof authenticate>
