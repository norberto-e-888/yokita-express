import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { UserPlainObject } from '../app/user/typings'
import { generateCode } from '@yokita/common'

export type JWT = typeof jwt
export type BCrypt = typeof bcrypt

declare module 'express' {
	interface Request {
		user?: UserPlainObject
	}
}

export type GenerateCode = typeof generateCode
