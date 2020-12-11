import {
	genericControllerFactory,
	GenericFunctionalController
} from '@yokita/common'
import userRepository from '../repository'

export default genericControllerFactory({
	repository: userRepository
}) as GenericFunctionalController
