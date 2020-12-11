import { Router } from 'express'
import smsController, { SmsController } from '../controller'

export const smsApiFactory = (deps: SmsApiDependencies) => {
	const router = Router()

	router.route('/').post(deps.smsController.handleReceiveSms)

	return router
}

export default smsApiFactory({ smsController })

export type SmsApiDependencies = {
	smsController: SmsController
}
