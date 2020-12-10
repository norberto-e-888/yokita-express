import { GenericCrudApi, genericCrudApiFactory } from '@yokita/common'
import { Router } from 'express'
import { userController } from '../controller'
import { adminAuthenticate, AuthenticateMiddleware } from '../../../lib'

export const userApiFactory = (deps: UserApiFactoryDependencies) => {
	const router = Router()
	router.use(deps.adminAuthenticate)
	router.use(deps.userCrudApi)
	return router
}

const userCrudApi = genericCrudApiFactory({ controller: userController })

export default userApiFactory({ adminAuthenticate, userCrudApi })
export type UserApiFactoryDependencies = {
	adminAuthenticate: AuthenticateMiddleware
	userCrudApi: GenericCrudApi
}
