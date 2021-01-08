import { ChangePasswordDto, SignUpDto } from '../app/auth'

export const validSignUpDto: SignUpDto = {
	email: 'test@test.com',
	name: {
		first: 'Test',
		last: 'Test'
	},
	password: 'test1234'
}

export const validChangePasswordDto: ChangePasswordDto = {
	password: validSignUpDto.password,
	newPassword: 'test123456'
}
