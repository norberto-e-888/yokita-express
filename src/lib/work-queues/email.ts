import { Queue, QueueScheduler, Worker } from 'bullmq'
import IORedis from 'ioredis'
import fs from 'fs'
import { emailService } from '../../app/email'
import { UserPlainObject } from '../../app/user'
import { EMAIL_QUEUE_NAME } from '../../constants'

const connection = new IORedis()

export const emailQueue = new Queue<EmailJobsDataTypes, void, EmailJob>(
	EMAIL_QUEUE_NAME,
	{ connection, defaultJobOptions: { removeOnComplete: true } }
)

export const emailQueueScheduler = new QueueScheduler(EMAIL_QUEUE_NAME, {
	connection
})

export const emailQueueWorker = new Worker<EmailJobsDataTypes, void, EmailJob>(
	EMAIL_QUEUE_NAME,
	async ({ name, data }) => {
		let typedData
		switch (name) {
			case EmailJob.Verification:
				typedData = data as EmailJobsData[typeof EmailJob.Verification]
				await emailService.sendEmailVerification(typedData.user, typedData.code)
				break

			case EmailJob.PasswordReset:
				typedData = data as EmailJobsData[typeof EmailJob.PasswordReset]
				await emailService.sendPasswordResetCode(typedData.user, typedData.code)
				break

			case EmailJob.SendErrorsToAdmins:
				const pathToErrorsLog = `${__dirname}/../../logs/errors.log`
				const attachement = fs.readFileSync(pathToErrorsLog).toString('base64')
				await emailService.sendErrorsToAdmin({
					content: attachement,
					filename: 'boilerplate-errors.txt',
					type: 'text'
				})

				fs.writeFileSync(pathToErrorsLog, '')
				break

			default:
				throw new Error(`Invalid email worker job name: ${name}`)
		}
	},
	{
		connection,
		limiter: { max: 1000, duration: 1000 * 60 * 2 }
	}
)

export enum EmailJob {
	PasswordReset = 'passwordResetEmail',
	Verification = 'verificationEmail',
	SendErrorsToAdmins = 'sendErrorsToAdmin'
}

type EmailPasswordResetJobData = {
	user: UserPlainObject
	code: string
}

type EmailVerificationJobData = {
	user: UserPlainObject
	code: string
}

type EmailJobsDataTypes =
	| EmailPasswordResetJobData
	| EmailVerificationJobData
	| undefined

export type EmailJobsData = {
	[EmailJob.PasswordReset]: EmailPasswordResetJobData
	[EmailJob.Verification]: EmailVerificationJobData
}

export type EmailQueue = Queue<EmailJobsDataTypes, void, EmailJob>
export type EmailQueueWorker = Worker<EmailJobsDataTypes, void, EmailJob>
