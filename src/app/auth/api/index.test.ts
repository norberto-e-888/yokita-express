import request from 'supertest'
import { validChangePasswordDto, validSignUpDto } from '../../../test/data'
import { userModel } from '../../user'

describe('/auth', () => {
	describe('PATCH /change-password', () => {
		it('Allows an authenticated user change their password as long as they know their current password and choose a valid new one', async () => {
			expect(validChangePasswordDto.password).not.toBe(
				validChangePasswordDto.newPassword
			)

			const credentials = await global.mockAuthenticate(validSignUpDto)
			const response = await request(global.app)
				.patch('/auth/change-password')
				.set('Cookie', ['accessToken=' + credentials.accessToken])
				.send({
					password: validChangePasswordDto.password,
					newPassword: validChangePasswordDto.newPassword
				})

			expect(response.status).toBe(200)
			expect(response.body.password).toBe(validChangePasswordDto.newPassword)
			const user = await userModel.findOne({ email: validSignUpDto.email })
			expect(user?.password).toBe(validChangePasswordDto.password)
		})
	})
})
