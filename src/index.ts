import 'express-async-errors'
import express, { Express } from 'express'
import env from './env'
import configureApp from './config'
import { logger } from './lib'

export default async function main(): Promise<Express> {
	const app = express()
	await configureApp(app)
	if (env.nodeEnv !== 'test') {
		app.listen(env.port, () => {
			logger.info('server running on port %s', env.port)
		})
	}

	return app
}

main()
