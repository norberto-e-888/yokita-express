import { User, UserName, UserPhone } from '../../user/typings'

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

export type ChangePasswordDto = {
	password: string
	newPassword: string
}

export type AuthenticationResult = {
	user: User
	accessToken: string
	refreshToken: string
}

export type AccessTokenPayload = {
	id: string
}

export type RefreshTokenPayload = {
	id: string
}

export type TwoFactorAuthTokenPayload = {
	code: string
}
