import { Router } from 'express'
import {
	authenticate,
	GenericCrudApi,
	genericCrudApiFactory
} from '@yokita/common'
import userController, { UserController } from '../controller'
import { UserPlainObject, UserRole } from '../typings'
import { cacheService } from '../../cache'
import userModel from '../model'
import env from '../../../env'
import { EndUserAuth } from '../../../lib'

const baseAuthenticate = authenticate({
	userModel,
	getCachedUser: cacheService.getCachedUser,
	jwtSecret: env.auth.jwtSecretAccessToken,
	jwtIn: 'cookies',
	jwtKeyName: 'jwt',
	ignoreExpirationURLs: ['/auth/refresh']
})

const superadminAuthenticate = baseAuthenticate(UserRole.SuperAdmin)()
const endUserAuthenticate = baseAuthenticate(
	UserRole.EndUser,
	UserRole.Admin,
	UserRole.SuperAdmin
)

export const userApiFactory = (deps: UserApiFactoryDependencies) => {
	const router = Router()
	router
		.route('/update-profile')
		.patch(
			deps.endUserAuthenticate(isNotInProcessOf2FA, isNotBlocked),
			deps.userController.handleUpdateProfile
		)

	router.use(deps.superadminAuthenticate, deps.userCrudApi)
	return router
}

const userCrudApi = genericCrudApiFactory({ controller: userController })

export default userApiFactory({
	superadminAuthenticate,
	endUserAuthenticate,
	userController,
	userCrudApi
})

export type UserApiFactoryDependencies = {
	superadminAuthenticate: SuperAdminAuth
	endUserAuthenticate: EndUserAuth
	userController: UserController
	userCrudApi: GenericCrudApi
}

export type SuperAdminAuth = typeof superadminAuthenticate
function isNotInProcessOf2FA(user: UserPlainObject): boolean {
	return !user.is2FALoginOnGoing
}

function isNotBlocked(user: UserPlainObject): boolean {
	return !user.isBlocked
}
