import { Router } from 'express'
import {
	authenticate,
	GenericCrudApi,
	genericCrudApiFactory,
	validateRequest
} from '@yokita/common'
import userController, { UserController } from '../controller'
import { UserRole } from '../typings'
import { cacheService } from '../../cache'
import userModel from '../model'
import env from '../../../env'
import { EndUserAuth } from '../../../lib'
import { AppExtraCondition } from '../../../typings'
import { updateProfileDtoJoiSchema } from '../validators'

const baseAuthenticate = authenticate({
	userModel,
	getCachedUser: cacheService.getCachedUser,
	jwtSecret: env.auth.jwtSecretAccessToken,
	jwtIn: 'cookies',
	jwtKeyName: 'accessToken',
	ignoreExpirationURLs: ['/auth/refresh']
})

const superadminAuthenticate = baseAuthenticate(UserRole.SuperAdmin)()
const endUserAuthenticate = baseAuthenticate(
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

export const isNotBlocked: AppExtraCondition = (user) => {
	return { doesContidionPass: !user.isBlocked, message: 'You are blocked.' }
}

export const userApiFactory = (deps: UserApiFactoryDependencies) => {
	const router = Router()
	router
		.route('/update-profile')
		.patch(
			deps.endUserAuthenticate(isNotInProcessOf2FA, isNotBlocked),
			validateRequest(updateProfileDtoJoiSchema, 'body'),
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
