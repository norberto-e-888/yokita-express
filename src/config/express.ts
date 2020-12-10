import { Express } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mongoSanitize from 'express-mongo-sanitize'
import { handle404, handleError } from '@yokita/common'
import authApi from '../app/auth/api'
import userApi from '../app/user/api'
import { authController } from '../app/auth/controller'
import env from '../env'

export default (app: Express): void => {
	app.use(helmet())
	app.use(
		cors({
			credentials: true,
			exposedHeaders: ['set-cookie'],
			origin: [env.clientUrl]
		})
	)

	app.use(bodyParser.json())
	app.use(cookieParser())
	app.use(mongoSanitize())
	app.use(authController.checkBlacklist)
	app.use('/auth', authApi)
	app.use('/user', userApi)
	app.use(handleError)
	app.use(handle404)
}
