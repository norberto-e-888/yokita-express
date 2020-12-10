import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { UserDocument } from '../app/user/typings'

export type JWT = typeof jwt
export type BCrypt = typeof bcrypt

declare module 'express' {
	interface Request {
		user?: UserDocument
	}
}
