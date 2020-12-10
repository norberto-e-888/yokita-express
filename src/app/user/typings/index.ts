import { CommonProperties } from '@yokita/common'
import { ClientSession, Document, Model, Types } from 'mongoose'

export interface User extends CommonProperties {
	name: UserName
	email: string
	password: string
	role: UserRole
	dob?: Date
	refreshToken?: string
	emailVerificationCode?: UserCode
	passwordResetCode?: UserCode
	isEmailVerified: boolean
	isBlocked: boolean
}

export enum UserRole {
	Admin = 'admin',
	Customer = 'customer'
}

export type OmittedUserProperties =
	| 'password'
	| 'refreshToken'
	| 'emailVerificationCode'
	| 'passwordResetCode'
	| 'isBlocked'

export type UserPlainObject = Omit<User, OmittedUserProperties>
export type UserName = {
	first: string
	middle?: string
	last?: string
}

export type UserCode = {
	value: string
	expiration: Date
}

export interface UserDocument extends User, Document {
	_id: Types.ObjectId
	id: string
	__v: number
	setCode: UserMethodSetCode
	isPasswordValid: UserMethodIsPasswordValid
}

export interface UserModel extends Model<UserDocument> {
	isEmailInUse: UserStaticIsEmailInUser
}

export type DoesEmailExistOptions = {
	throwIfExists?: boolean
}

export type SetCodeOptions = {
	save?: boolean
	expiresIn?: number
	session?: ClientSession
}

export type SetCodeProperties = 'emailVerificationCode' | 'passwordResetCode'
export type UserStaticIsEmailInUser = (
	this: UserModel,
	email: string
) => Promise<boolean>

export type UserMethodSetCode = (
	this: UserDocument,
	property: SetCodeProperties,
	options: SetCodeOptions
) => Promise<string>

export type IsPasswordValidOptions = {
	throwIfInvalid: boolean
}

export type UserMethodIsPasswordValid = (
	this: UserDocument,
	triedPassword: string,
	options: IsPasswordValidOptions
) => Promise<boolean>

export type CreateUserDto = {
	name: UserName
	email: string
	password: string
	role?: UserRole
	dob?: Date
}
