import { CommonProperties } from '@yokita/common'
import { ClientSession, Document, Model, Types } from 'mongoose'

export interface User extends CommonProperties {
	name: UserName
	email: string
	phone?: UserPhone
	role: UserRole
	dob?: Date
	isEmailVerified: boolean
	isPhoneVerified: boolean
	isBlocked: boolean
	is2FAEnabled: boolean
	is2FALoginOnGoing: boolean
	password: string
	refreshToken?: string
	twoFactorAuthToken?: string
	emailVerificationCode?: UserCode
	phoneVerificationCode?: UserCode
	passwordResetCode?: UserCode
}

export enum UserRole {
	Admin = 'admin',
	EndUser = 'enduser',
	SuperAdmin = 'superadmin'
}

export type OmittedUserProperties =
	| 'password'
	| 'refreshToken'
	| 'twoFactorAuthToken'
	| 'emailVerificationCode'
	| 'phoneVerificationCode'
	| 'passwordResetCode'

export type UserPlainObject = Omit<User, OmittedUserProperties>
export type UserName = {
	first: string
	middle?: string
	last?: string
}

export type UserPhone = {
	prefix: string
	value: string
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
	verifyInfo: UserMethodVerifyInfo
	resetPassword: UserMethodResetPassword
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

export type SetCodeProperties =
	| 'emailVerificationCode'
	| 'phoneVerificationCode'
	| 'passwordResetCode'

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

export type UserMethodVerifyInfo = (
	this: UserDocument,
	triedCode: string,
	info: 'phoneVerificationCode' | 'emailVerificationCode',
	options?: VerifyInfoOptions
) => Promise<UserDocument>

export type VerifyInfoOptions = {
	throwIfInvalid: boolean
}

export type UserMethodResetPassword = (
	this: UserDocument,
	triedCode: string,
	newPassword: string
) => Promise<UserDocument | void>

export type CreateUserDto = {
	name: UserName
	email: string
	password: string
	role?: UserRole
	dob?: Date
}
