import { GenericFunctionalRepository } from '@yokita/common'
import userModel from '../model'
import userRepository from '../repository'
import { UserDocument, UserModel, UserPlainObject } from '../typings'

export const userSeviceFactory = (deps: UserServiceDependencies) => {
	async function updateProfile(
		userId: string,
		triedPassword: string,
		dto: Partial<UserPlainObject>
	): Promise<UserPlainObject> {
		const user = (await deps.userRepository.findById(userId, {
			failIfNotFound: true
		})) as UserDocument

		// TODO: Validate dto against a Joi schema to prevent setting of protected properties
		await user.isPasswordValid(triedPassword, { throwIfInvalid: true })
		await user.set(dto).save({ validateModifiedOnly: true })
		return user.toObject()
	}

	return { updateProfile }
}

export default userSeviceFactory({ userRepository, userModel: userModel })

export type UserService = ReturnType<typeof userSeviceFactory>
export type UserServiceDependencies = {
	userRepository: GenericFunctionalRepository
	userModel: UserModel
}
