import { Router } from 'express'
import { AuthenticateMiddleware, endUserAuthenticate } from '../../../lib'
import { authController, AuthController } from '../controller'

export const authApiFactory = (deps: AuthApiFactoryDependencies) => {
	const router = Router()
	router
		.route('/sign-up')
		.post(
			deps.authController.protectRoleSetting,
			deps.authController.handleSignUp
		)

	router.route('/sign-in').post(deps.authController.handleSignIn)
	router
		.route('/sign-out')
		.patch(deps.endUserAuthenticate, deps.authController.handleSignOut)

	router
		.route('/verify/:info/:code')
		.patch(deps.endUserAuthenticate, deps.authController.handleVerifyUserInfo)

	router
		.route('/recover/:via/:info')
		.patch(deps.authController.handleRecoverAccount)

	router
		.route('/refresh')
		.get(deps.endUserAuthenticate, deps.authController.handleRefreshAccessToken)

	router
		.route('/current-user')
		.get(deps.endUserAuthenticate, deps.authController.handleGetCurrentUser)

	return router
}

export default authApiFactory({
	endUserAuthenticate,
	authController
})
export type AuthApiFactoryDependencies = {
	endUserAuthenticate: AuthenticateMiddleware
	authController: AuthController
}
