import './events'
import { Express } from 'express'
import expressConfig from './express'
import mongooseConfig from './mongoose'
import env from '../env'

export default async (app: Express): Promise<void> => {
	expressConfig(app)
	await mongooseConfig({
		mongoDbUri: env.db.mongoUri,
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false,
		useUnifiedTopology: true
	})
}
