import { Queue, QueueScheduler, Worker } from 'bullmq'
import IORedis from 'ioredis'
import { smsService } from '../../app/sms'
import { UserPlainObject } from '../../app/user'
import { SMS_QUEUE_NAME } from '../../constants'

const connection = new IORedis()

export const smsQueue = new Queue<SMSJobsDataTypes, void, SMSJob>(
	SMS_QUEUE_NAME,
	{
		connection,
		defaultJobOptions: { removeOnComplete: true }
	}
)

export const smsQueueScheduler = new QueueScheduler(SMS_QUEUE_NAME, {
	connection
})

export const smsQueueWorker = new Worker<SMSJobsDataTypes, void, SMSJob>(
	SMS_QUEUE_NAME,
	async ({ name, data }) => {
		let typedData
		switch (name) {
			case SMSJob.Verification:
				typedData = data as SMSJobsData[typeof SMSJob.Verification]
				smsService.sendVerification(typedData.user, typedData.code)
				break

			case SMSJob.TwoFA:
				typedData = data as SMSJobsData[typeof SMSJob.TwoFA]
				smsService.send2FACode(typedData.user, typedData.code)
				break

			case SMSJob.PasswordReset:
				typedData = data as SMSJobsData[typeof SMSJob.PasswordReset]
				smsService.sendPasswordResetCode(typedData.user, typedData.code)
				break

			default:
				throw new Error(`Invalid sms worker job name: ${name}`)
		}
	},
	{
		connection,
		limiter: { max: 1000, duration: 1000 * 60 * 2 }
	}
)

export enum SMSJob {
	Verification = 'SmsVerification',
	TwoFA = 'Sms2FA',
	PasswordReset = 'SmsPasswordReset'
}

type CommonSMSJobDataType = {
	user: UserPlainObject
	code: string
}

type SMSVerificationJobData = CommonSMSJobDataType
type SMS2FAJobData = CommonSMSJobDataType
type SMSPasswordResetJobData = CommonSMSJobDataType

type SMSJobsDataTypes =
	| SMSVerificationJobData
	| SMS2FAJobData
	| SMSPasswordResetJobData

export type SMSJobsData = {
	[SMSJob.Verification]: SMSVerificationJobData
	[SMSJob.TwoFA]: SMS2FAJobData
	[SMSJob.PasswordReset]: SMSPasswordResetJobData
}

export type SMSQueue = Queue<SMSJobsDataTypes, void, SMSJob>
export type SMSQueueWorker = Worker<SMSJobsDataTypes, void, SMSJob>
