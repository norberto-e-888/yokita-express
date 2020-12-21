import { GenericFunctionalRepository } from '@yokita/common'
import userModel from '../model'
import userRepository from '../repository'
import {
	UpdateUserDto,
	UserDocument,
	UserModel,
	UserPlainObject
} from '../typings'

export const userSeviceFactory = (deps: UserServiceDependencies) => {
	async function updateProfile(
		userId: string,
		triedPassword: string,
		dto: UpdateUserDto
	): Promise<UserPlainObject> {
		const user = (await deps.userRepository.findById(userId, {
			failIfNotFound: true
		})) as UserDocument

		await user.isPasswordValid(triedPassword, { throwIfInvalid: true })
		await user.set(dto).save({ validateModifiedOnly: true })
		return user.toObject()
	}

	return { updateProfile }
}

export default userSeviceFactory({ userRepository, userModel })

export type UserService = ReturnType<typeof userSeviceFactory>
export type UserServiceDependencies = {
	userRepository: GenericFunctionalRepository
	userModel: UserModel
}
