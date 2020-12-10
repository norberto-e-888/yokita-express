import mongoose from 'mongoose'
import { Db } from 'mongodb'
import env from '../env'

mongoose.set('debug', env.nodeEnv === 'development')

export default async ({
	mongoDbUri,
	useNewUrlParser,
	useCreateIndex,
	useFindAndModify,
	useUnifiedTopology,
}: MongooseConfigOptions): Promise<Db> => {
	const {
		connection: { db },
	} = await mongoose.connect(mongoDbUri, {
		useNewUrlParser,
		useCreateIndex,
		useFindAndModify,
		useUnifiedTopology,
	})

	return db
}

export interface MongooseConfigOptions {
	mongoDbUri: string
	useNewUrlParser: boolean
	useCreateIndex: boolean
	useFindAndModify: boolean
	useUnifiedTopology: boolean
}
