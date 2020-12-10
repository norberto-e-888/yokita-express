const nodeEnv = process.env.NODE_ENV as 'test' | 'development' | 'production'
if (!nodeEnv) {
	throw new Error('NODE_ENV is not set.')
}

const port = process.env.PORT
if (!port) {
	throw new Error('PORT is not set.')
}

const mongoUri = process.env.MONGO_URI
if (!mongoUri) {
	throw new Error('MONGO_URI is not set.')
}

const jwtSecretAccessToken = process.env.JWT_SECRET_ACCESS_TOKEN
if (!jwtSecretAccessToken) {
	throw new Error('JWT_SECRET_ACCESS_TOKEN is not set.')
}

const jwtSecretRefreshToken = process.env.JWT_SECRET_REFRESH_TOKEN
if (!jwtSecretRefreshToken) {
	throw new Error('JWT_SECRET_REFRESH_TOKEN is not set.')
}

export default {
	nodeEnv,
	port,
	db: {
		mongoUri
	},
	auth: {
		jwtSecretAccessToken,
		jwtSecretRefreshToken
	},
	clientUrl: process.env.CLIENT_URL as string
}
