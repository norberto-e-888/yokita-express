import {
	genericControllerFactory,
	GenericFunctionalController
} from '@yokita/common'
import { NextFunction, Request, Response } from 'express'
import userRepository from '../repository'
import userService, { UserService } from '../service'

export const userControllerFactory = (deps: UserControllerDependencies) => {
	async function handleUpdateProfile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			const updatedUser = await deps.userService.updateProfile(
				req.user?.id as string,
				req.body.password,
				req.body.updates
			)

			return res.json(updatedUser)
		} catch (error) {
			return next(error)
		}
	}

	return {
		handleUpdateProfile
	}
}

const userController = userControllerFactory({ userService })
const genericController = genericControllerFactory({
	repository: userRepository
}) as GenericFunctionalController

const createController = () => Object.assign(userController, genericController)
export default createController()
export type UserController = ReturnType<typeof createController>
export type UserControllerDependencies = {
	userService: UserService
}
