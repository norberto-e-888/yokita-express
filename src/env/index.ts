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

const jwtSecret2FA = process.env.JWT_SECRET_2FA || jwtSecretRefreshToken
const sendGridApiKey = process.env.SENDGRID_API_KEY
if (!sendGridApiKey) {
	throw new Error('SENDGRID_API_KEY is not set.')
}

const sendGridDomain = process.env.SENDGRID_FROM
if (!sendGridDomain) {
	throw new Error('SENDGRID_FROM is not set.')
}

const twilioSid = process.env.TWILIO_SID
if (!twilioSid) {
	throw new Error('TWILIO_SID is not set.')
}

const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
if (!twilioAuthToken) {
	throw new Error('TWILIO_AUTH_TOKEN is not set.')
}

const twilioNumber = process.env.TWILIO_NUMBER
if (!twilioNumber) {
	throw new Error('TWILIO_NUMBER is not set.')
}

export default {
	nodeEnv,
	port,
	db: {
		mongoUri
	},
	auth: {
		jwtSecretAccessToken,
		jwtSecretRefreshToken,
		jwtSecret2FA
	},
	clientUrl: process.env.CLIENT_URL as string,
	sendgrid: {
		apiKey: sendGridApiKey,
		from: sendGridDomain
	},
	twilio: {
		sid: twilioSid,
		authToken: twilioAuthToken,
		number: twilioNumber
	}
}
