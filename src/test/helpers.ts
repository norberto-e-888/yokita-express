import request from 'supertest'
import { extractCookies } from '@yokita/common'
import { UserDocument, UserModel } from '../app/user'
import { SignInDto, SignUpDto } from '../app/auth'

export const mockSignUp = async (dto: SignUpDto): Promise<UserDocument> => {
	const User = global.connection.model('User') as UserModel
	return await User.create<SignUpDto>(dto)
}

export const mockAuthenticate = async (
	dto: SignUpDto | SignInDto,
	type: 'sign-in' | 'sign-up' = 'sign-up'
) => {
	const response = await request(global.app)
		.post('/auth/' + type)
		.send(dto)
		.expect(type === 'sign-up' ? 201 : 200)

	return extractCookies(response.headers)
}
