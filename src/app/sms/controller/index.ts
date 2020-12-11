import { NextFunction, Request, Response } from 'express'
import MessagingResponse from 'twilio/lib/twiml/MessagingResponse'
import smsService, { SmsService } from '../service'

export const smsControllerFactory = (_: SmsControllerFactoryDependencies) => {
	async function handleReceiveSms(
		_: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			const twiml = new MessagingResponse()
			twiml.message('Testing testing...')
			res.writeHead(200, { 'Content-Type': 'text/xml' })
			return res.end(twiml.toString())
		} catch (error) {
			return next(error)
		}
	}

	return { handleReceiveSms }
}

export default smsControllerFactory({ smsService })

export type SmsController = ReturnType<typeof smsControllerFactory>
export type SmsControllerFactoryDependencies = {
	smsService: SmsService
}
