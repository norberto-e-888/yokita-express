import { Express } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mongoSanitize from 'express-mongo-sanitize'
import { handle404, handleError } from '@yokita/common'
import {
	authApi,
	authController,
	superadminAuthenticate,
	endUserAuthenticate,
	isNotBlocked,
	isNotInProcessOf2FA
} from '../app/auth'
import { userApiFactory, userController, userCrudApi } from '../app/user'
import { smsApi } from '../app/sms'
import env from '../env'
import { basicLimiter } from '../lib'

const userApi = userApiFactory({
	superadminAuthenticate,
	endUserAuthenticate,
	isNotBlocked,
	isNotInProcessOf2FA,
	userController,
	userCrudApi
}) /* userApi needs to be declared here because app/auth/lib depends on app/user and in turn app/user dependes on auth/lib 
	  so the user module is executed first and it reads "undefined" from auth/lib */

export default (app: Express): void => {
	app.use(helmet())
	app.use(
		cors({
			credentials: true,
			exposedHeaders: ['set-cookie'],
			origin: [env.clientUrl]
		})
	)

	app.use(basicLimiter)
	app.use(bodyParser.json())
	app.use(cookieParser())
	app.use(mongoSanitize())
	app.use(authController.checkBlacklist)
	app.use(authController.protectRoleSetting)
	app.use('/auth', authApi)
	app.use('/sms', smsApi)
	app.use('/user', userApi)
	app.use(handleError)
	app.use(handle404)
}
