import request from 'supertest'
import { validChangePasswordDto, validSignUpDto } from '../../../test/data'
import { userModel } from '../../user'

describe('/auth', () => {
	describe('PATCH /change-password', () => {
		it('Allows an authenticated user change their password as long as they know their current password and choose a valid new one', async () => {
			expect(validChangePasswordDto.password).not.toBe(
				validChangePasswordDto.newPassword
			)

			const credentials = await global.authenticate(validSignUpDto)
			const response = await request(global.app)
				.patch('/auth/change-password')
				.set('Cookie', ['accessToken=' + credentials.accessToken.value])
				.send(validChangePasswordDto)

			expect(response.status).toBe(200)
			const user = await userModel.findOne({ email: validSignUpDto.email })
			expect(
				user &&
					(await user.isPasswordValid(validChangePasswordDto.newPassword, {
						throwIfInvalid: false
					}))
			).toBe(true)
		})
	})
})
