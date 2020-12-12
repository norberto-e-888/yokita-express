import { GenericCrudApi, genericCrudApiFactory } from '@yokita/common'
import { Router } from 'express'
import userController from '../controller'
import { SuperAdminAuth, superadminAuthenticate } from '../../../lib'

export const userApiFactory = (deps: UserApiFactoryDependencies) => {
	const router = Router()
	router.use(deps.superadminAuthenticate, deps.userCrudApi)
	return router
}

const userCrudApi = genericCrudApiFactory({ controller: userController })

export default userApiFactory({ superadminAuthenticate, userCrudApi })
export type UserApiFactoryDependencies = {
	superadminAuthenticate: SuperAdminAuth
	userCrudApi: GenericCrudApi
}
