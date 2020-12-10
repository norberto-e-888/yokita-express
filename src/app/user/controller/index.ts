import {
	genericControllerFactory,
	GenericFunctionalController
} from '@yokita/common'
import { userRepository } from '../repository'

export const userController: GenericFunctionalController = genericControllerFactory(
	{
		repository: userRepository
	}
)
