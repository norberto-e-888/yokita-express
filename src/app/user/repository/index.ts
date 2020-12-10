import {
	GenericFunctionalRepository,
	genericRepositoryFactory
} from '@yokita/common'
import userModel from '../model'
import { UserDocument, UserPlainObject } from '../typings'

export const userRepository: GenericFunctionalRepository = genericRepositoryFactory<
	UserDocument,
	UserPlainObject
>({ model: userModel }, { documentNameSingular: 'user' })
