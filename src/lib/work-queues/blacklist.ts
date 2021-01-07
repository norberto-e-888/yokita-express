import { Queue, QueueScheduler, Worker } from 'bullmq'
import IORedis from 'ioredis'
import { blacklistService } from '../../app/blacklist'
import { BLACKLIST_QUEUE_NAME } from '../../constants'

const connection = new IORedis()

export const blacklistQueue = new Queue<
	BlacklistJobsDataTypes,
	void,
	BlacklistJob
>(BLACKLIST_QUEUE_NAME, {
	connection,
	defaultJobOptions: { removeOnComplete: true }
})

export const blacklistQueueScheduler = new QueueScheduler(
	BLACKLIST_QUEUE_NAME,
	{
		connection
	}
)

export const blacklistQueueWorker = new Worker<
	BlacklistJobsDataTypes,
	void,
	BlacklistJob
>(
	BLACKLIST_QUEUE_NAME,
	async ({ name, data }) => {
		let typedData
		switch (name) {
			case BlacklistJob.AddIpToBlacklist:
				typedData = data as BlacklistJobsData[typeof BlacklistJob.AddIpToBlacklist]
				blacklistService.blacklistIp(typedData)
				break

			case BlacklistJob.AddIpToWhitelist:
				typedData = data as BlacklistJobsData[typeof BlacklistJob.AddIpToWhitelist]
				blacklistService.whitelistIp(typedData)
				break

			case BlacklistJob.BlacklistUser:
				typedData = data as BlacklistJobsData[typeof BlacklistJob.BlacklistUser]
				blacklistService.blacklistIp(typedData.ip)
				await blacklistService.blacklistUser(typedData.userId, typedData.ip)
				break

			default:
				throw new Error(`Invalid blacklist worker job name: ${name}`)
		}
	},
	{
		connection,
		limiter: { max: 1000, duration: 1000 * 60 * 2 }
	}
)

export enum BlacklistJob {
	AddIpToBlacklist = 'addIpToBlacklist',
	AddIpToWhitelist = 'addIpToWhitelist',
	BlacklistUser = 'blacklistUser'
}

type BlacklistAddIpJobData = string
type BlacklistWhitelistIpJobData = string
type BlacklistAddUserJobData = {
	userId: string
	ip: string
}

type BlacklistJobsDataTypes =
	| BlacklistAddIpJobData
	| BlacklistWhitelistIpJobData
	| BlacklistAddUserJobData

export type BlacklistJobsData = {
	[BlacklistJob.AddIpToBlacklist]: BlacklistAddIpJobData
	[BlacklistJob.AddIpToWhitelist]: BlacklistWhitelistIpJobData
	[BlacklistJob.BlacklistUser]: BlacklistAddUserJobData
}

export type BlacklistQueue = Queue<BlacklistJobsDataTypes, void, BlacklistJob>
export type BlacklistQueueWorker = Worker<
	BlacklistJobsDataTypes,
	void,
	BlacklistJob
>
