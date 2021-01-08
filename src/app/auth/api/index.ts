import { Router } from 'express'
import {
	EndUserAuth,
	endUserAuthenticate,
	isInProcessOf2FA,
	isNotBlocked,
	isNotInProcessOf2FA,
	isPhoneVerified,
	isVerificationRequestNotRedundant,
	isVerificationResendRequestNotRedundantOrInvalid,
	unauthenticatedOnly,
	UnauthOnly
} from '../../../lib'
import authController, { AuthController } from '../controller'

export const authApiFactory = (deps: AuthApiFactoryDependencies) => {
	const router = Router()
	// * Only unauthenticated requests --start
	router
		.route('/sign-up')
		.post(deps.unauthenticatedOnly, deps.authController.handleSignUp)

	router
		.route('/sign-in')
		.post(deps.unauthenticatedOnly, deps.authController.handleSignIn)

	router
		.route('/recover/:via/:info')
		.patch(deps.unauthenticatedOnly, deps.authController.handleRecoverAccount)

	router
		.route('/reset-password/:via/:info/:code')
		.patch(deps.unauthenticatedOnly, deps.authController.handleResetPasword)
	// * Only unauthenticated requests --end
	// ! Protected routes
	router
		.route('/2fa')
		.post(
			deps.endUserAuthenticate(isInProcessOf2FA, isNotBlocked),
			deps.authController.handle2FA
		)

	router
		.route('/toggle-2fa')
		.patch(
			deps.endUserAuthenticate(
				isNotInProcessOf2FA,
				isNotBlocked,
				isPhoneVerified
			),
			deps.authController.handleToggle2FA
		)

	router
		.route('/resend-2fa-code')
		.get(
			deps.endUserAuthenticate(isInProcessOf2FA, isNotBlocked, isPhoneVerified),
			deps.authController.handleResend2FACode
		)

	router
		.route('/resend-verification/:type')
		.get(
			deps.endUserAuthenticate(
				isNotInProcessOf2FA,
				isNotBlocked,
				isVerificationResendRequestNotRedundantOrInvalid
			),
			deps.authController.handleResendVerificationCode
		)

	router
		.route('/verify/:info/:code')
		.patch(
			deps.endUserAuthenticate(
				isNotInProcessOf2FA,
				isNotBlocked,
				isVerificationRequestNotRedundant
			),
			deps.authController.handleVerifyUserInfo
		)

	router
		.route('/change-password')
		.patch(
			deps.endUserAuthenticate(isNotInProcessOf2FA, isNotBlocked),
			deps.authController.handleChangePasword
		)

	router
		.route('/sign-out')
		.patch(deps.endUserAuthenticate(), deps.authController.handleSignOut)

	router
		.route('/refresh')
		.get(
			deps.endUserAuthenticate(isNotBlocked),
			deps.authController.handleRefreshAccessToken
		)

	router
		.route('/current-user')
		.get(
			deps.endUserAuthenticate(isNotBlocked),
			deps.authController.handleGetCurrentUser
		)

	return router
}

export default authApiFactory({
	endUserAuthenticate,
	unauthenticatedOnly,
	authController
})

export type AuthApiFactoryDependencies = {
	endUserAuthenticate: EndUserAuth
	unauthenticatedOnly: UnauthOnly
	authController: AuthController
}
