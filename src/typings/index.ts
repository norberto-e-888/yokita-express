import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { UserPlainObject } from '../app/user/typings'
import { generateCode } from '@yokita/common'
import { ExtraCondition } from '@yokita/common/build/middleware/authenticate'

export type JWT = typeof jwt
export type BCrypt = typeof bcrypt
export type GenerateCode = typeof generateCode
export type AppExtraCondition = ExtraCondition<UserPlainObject>

declare module 'express' {
	interface Request {
		user?: UserPlainObject
	}
}
