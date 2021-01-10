import { Router } from 'express'
import {
	GenericCrudApi,
	genericCrudApiFactory,
	validateRequest
} from '@yokita/common'
import { updateProfileDtoJoiSchema } from '../validators'
import userController, { UserController } from '../controller'
import {
	EndUserAuth,
	SuperAdminAuth,
	isNotInProcessOf2FA,
	isNotBlocked
} from '../../../app/auth'
import { AppExtraCondition } from '../../../typings'

export const userApiFactory = (deps: UserApiFactoryDependencies) => {
	const router = Router()
	router
		.route('/update-profile')
		.patch(
			deps.endUserAuthenticate(isNotInProcessOf2FA, isNotBlocked),
			validateRequest(updateProfileDtoJoiSchema, 'body'),
			deps.userController.handleUpdateProfile
		)

	router.use(deps.superadminAuthenticate(), deps.userCrudApi)
	return router
}

export const userCrudApi = genericCrudApiFactory({ controller: userController })

export type UserApiFactoryDependencies = {
	superadminAuthenticate: SuperAdminAuth
	endUserAuthenticate: EndUserAuth
	isNotInProcessOf2FA: AppExtraCondition
	isNotBlocked: AppExtraCondition
	userController: UserController
	userCrudApi: GenericCrudApi
}
