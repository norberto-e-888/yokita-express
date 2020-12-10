import { User, UserName, UserRole } from '../../user/typings'

export type SignUpDto = {
	name: UserName
	email: string
	password: string
	dob?: Date
	role: UserRole
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
