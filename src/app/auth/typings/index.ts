import { User, UserName, UserPhone, UserPlainObject } from '../../user/typings'

export type SignUpDto = {
	name: UserName
	email: string
	password: string
	phone?: UserPhone
	dob?: Date
}

export type SignInDto = {
	email: string
	password: string
}

export type AuthenticationResult = {
	user: User
	jwt: string
	refreshToken: string
}

export type AccessTokenPayload = {
	user: Pick<UserPlainObject, 'id' | 'is2FALoginOnGoing'>
	ip: string
}

export type RefreshTokenPayload = {
	ip: string
}

export type TwoFactorAuthTokenPayload = {
	ip: string
	code: string
}
