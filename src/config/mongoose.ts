import mongoose from 'mongoose'

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
