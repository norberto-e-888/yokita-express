import mongoose from 'mongoose'
/* import env from '../env'

mongoose.set('debug', env.nodeEnv === 'development') */

export default async ({
	mongoDbUri,
	useNewUrlParser,
	useCreateIndex,
	useFindAndModify,
	useUnifiedTopology
}: MongooseConfigOptions): Promise<void> => {
	await mongoose.connect(mongoDbUri, {
		useNewUrlParser,
		useCreateIndex,
		useFindAndModify,
		useUnifiedTopology
	})
}

export interface MongooseConfigOptions {
	mongoDbUri: string
	useNewUrlParser: boolean
	useCreateIndex: boolean
	useFindAndModify: boolean
	useUnifiedTopology: boolean
}
