import {
	GenericFunctionalRepository,
	genericRepositoryFactory
} from '@yokita/common'
import userModel from '../model'
import { UserDocument, UserPlainObject } from '../typings'

export default genericRepositoryFactory<UserDocument, UserPlainObject>(
	{ model: userModel },
	{ documentNameSingular: 'user' }
) as GenericFunctionalRepository
