import { User, UserName, UserPhone } from '../../user/typings'

export type SignUpDto = {
	name: UserName
	email: string
	password: string
	phone?: UserPhone
	dob?: Date
	is2FAEnabled?: boolean
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

export type RefreshTokenPayload = {
	ip: string
}

export type TwoFactorAuthTokenPayload = {
	ip: string
	code: string
}
