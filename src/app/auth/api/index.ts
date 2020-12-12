import { Router } from 'express'
import { EndUserAuth, endUserAuthenticate } from '../../../lib'
import authController, { AuthController } from '../controller'

export const authApiFactory = (deps: AuthApiFactoryDependencies) => {
	const router = Router()
	router.route('/sign-up').post(deps.authController.handleSignUp)
	router.route('/sign-in').post(deps.authController.handleSignIn)
	router
		.route('/recover/:via/:info')
		.patch(deps.authController.handleRecoverAccount)

	router
		.route('/reset-password/:via/:info/:code')
		.patch(deps.authController.handleResetPasword)

	// ! Protected routes (end user)
	router.use(deps.endUserAuthenticate)
	router
		.route('/verify/:info/:code')
		.patch(deps.authController.handleVerifyUserInfo)

	router.route('/2fa').post(deps.authController.handle2FA)
	router.route('/sign-out').patch(deps.authController.handleSignOut)
	router.route('/refresh').get(deps.authController.handleRefreshAccessToken)
	router.route('/current-user').get(deps.authController.handleGetCurrentUser)

	return router
}

export default authApiFactory({
	endUserAuthenticate,
	authController
})

export type AuthApiFactoryDependencies = {
	endUserAuthenticate: EndUserAuth
	authController: AuthController
}
