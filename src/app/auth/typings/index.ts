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

export interface AuthenticationResult {
	user: User
	jwt: string
	refreshToken: string
}

export interface RefreshTokenPayload {
	ip: string
}
