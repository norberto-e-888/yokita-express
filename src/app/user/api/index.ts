import { Router } from 'express'
import {
	authenticate,
	GenericCrudApi,
	genericCrudApiFactory
} from '@yokita/common'
import userController from '../controller'
import { UserRole } from '../typings'
import { cacheService } from '../../cache'
import { userModel } from '..'
import env from '../../../env'

export const superadminAuthenticate = authenticate({
	userModel,
	getCachedUser: cacheService.getCachedUser,
	jwtSecret: env.auth.jwtSecretAccessToken,
	jwtIn: 'cookies',
	jwtKeyName: 'jwt',
	isProtected: true,
	ignoreExpirationURLs: ['/auth/refresh']
})(UserRole.SuperAdmin)()

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

export type SuperAdminAuth = typeof superadminAuthenticate
