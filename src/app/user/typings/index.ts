import { CommonProperties } from '@yokita/common'
import { ClientSession, Document, Model, Types } from 'mongoose'

export interface User extends CommonProperties {
	name: UserName
	email: string
	phone?: UserPhone
	dob?: Date
	role: UserRole
	isEmailVerified: boolean
	isPhoneVerified: boolean
	isBlocked: boolean
	is2FAEnabled: boolean
	is2FALoginOnGoing: boolean
	password: string
	refreshToken?: string
	twoFactorAuthCode?: UserCode
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
	| 'twoFactorAuthCode'
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
	isCodeValid: UserMethodIsCodeValid
	isPasswordValid: UserMethodIsPasswordValid
	verifyInfo: UserMethodVerifyInfo
	sendVerification: UserMethodSendVerification
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
	| 'twoFactorAuthCode'

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

export type UserMethodIsCodeValid = (
	this: UserDocument,
	code: SetCodeProperties,
	triedCode: string,
	opts?: IsCodeValidOptions
) => Promise<{ isValid: boolean; isExpired: boolean }>

export type IsCodeValidOptions = { ignoreExpiration?: boolean }

export type UserMethodSendVerification = (
	this: UserDocument,
	type: 'email' | 'phone',
	save?: boolean
) => Promise<void>

export type UpdateUserDto = Partial<
	Pick<User, 'name' | 'email' | 'phone' | 'dob'>
>
