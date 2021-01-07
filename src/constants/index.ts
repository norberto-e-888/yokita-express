import { CookieOptions } from 'express'
import { UserRole } from '../app/user/typings'
import env from '../env'

export const VALID_EMAIL_REGEX = new RegExp(
	/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
)

export const THE_START_OF_THE_WORLD = 'Thu, 01 Jan 1970 00:00:00 GMT'
export const COOKIE_OPTIONS: CookieOptions = {
	httpOnly: true,
	secure: env.nodeEnv === 'production'
}

export const FORBIDDEN_ROLES: UserRole[] = [UserRole.Admin, UserRole.SuperAdmin]
export const ALLOWED_ROLES: UserRole[] = Object.values(UserRole).filter(
	(r) => !FORBIDDEN_ROLES.includes(r)
)

export const COMMON_TRANSACTION_OPTIONS = {
	readPreference: 'primary',
	readConcern: { level: 'local' },
	writeConcern: { w: 'majority' }
}

export const EMAIL_QUEUE_NAME = 'emailQueue'
