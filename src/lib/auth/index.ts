import { authenticate } from '@yokita/common'
import { cacheService } from '../../app/cache'
import { userModel } from '../../app/user'
import { UserRole } from '../../app/user/typings'
import env from '../../env'
import { AppExtraCondition } from '../../typings'

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

export const isNotInProcessOf2FA: AppExtraCondition = (user) => {
	return {
		doesContidionPass: !user.is2FALoginOnGoing,
		message: 'You must not be in process of 2FA login.'
	}
}

export const isInProcessOf2FA: AppExtraCondition = (user) => {
	return {
		doesContidionPass: user.is2FALoginOnGoing,
		message: 'You must be in process of login in with 2FA.'
	}
}

export const isNotBlocked: AppExtraCondition = (user) => {
	return { doesContidionPass: !user.isBlocked, message: 'You are blocked.' }
}

export const isPhoneVerified: AppExtraCondition = (user) => {
	return {
		doesContidionPass: user.isPhoneVerified,
		message: 'Your phone must be verified.'
	}
}

export const isVerificationRequestNotRedundant: AppExtraCondition = (
	user,
	req
) => {
	if (req.params.info === 'phone' && user.isPhoneVerified) {
		return {
			doesContidionPass: false,
			message: 'Your phone is already verified.'
		}
	}

	if (req.params.info === 'email' && user.isEmailVerified) {
		return {
			doesContidionPass: false,
			message: 'Your email is already verified.'
		}
	}

	return { doesContidionPass: true }
}

export const isVerificationResendRequestNotRedundantOrInvalid: AppExtraCondition = (
	user,
	req
) => {
	const type = req.params.type as 'email' | 'phone'
	if (type === 'email' && user.isEmailVerified)
		return {
			doesContidionPass: false,
			message: 'Your email is already verified.'
		}

	if (type === 'phone' && (user.isPhoneVerified || !user.phone))
		return {
			doesContidionPass: false,
			message: "Your phone is already verified or you don't have a phone set."
		}

	return { doesContidionPass: true }
}

export type BaseAuth = typeof baseAuthenticate
export type UnauthOnly = typeof unauthenticatedOnly
export type EndUserAuth = typeof endUserAuthenticate
export type AdminAuth = typeof adminAuthenticate
export type SuperAdminAuth = typeof superadminAuthenticate
