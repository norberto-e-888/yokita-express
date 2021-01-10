import { Queue, QueueScheduler, Worker } from 'bullmq'
import { cacheService } from '../../app/cache'
import { UserPlainObject } from '../../app/user'
import { CACHE_QUEUE_NAME } from '../../constants'
import { redisConnection } from '../redis'

export const cacheQueue = new Queue<CacheJobsDataTypes, void, CacheJob>(
	CACHE_QUEUE_NAME,
	{ connection: redisConnection, defaultJobOptions: { removeOnComplete: true } }
)

export const cacheQueueScheduler = new QueueScheduler(CACHE_QUEUE_NAME, {
	connection: redisConnection
})

export const cacheQueueWorker = new Worker<CacheJobsDataTypes, void, CacheJob>(
	CACHE_QUEUE_NAME,
	async ({ name, data }) => {
		let typedData
		switch (name) {
			case CacheJob.InvalidateUserCache:
				typedData = data as CacheJobsData[typeof CacheJob.InvalidateUserCache]
				cacheService.invalidateUserCache(typedData)
				break

			case CacheJob.CacheUser:
				typedData = data as CacheJobsData[typeof CacheJob.CacheUser]
				cacheService.cacheUser(typedData, (err) => {
					typedData = data as CacheJobsData[typeof CacheJob.CacheUser]
					if (err) {
						cacheService.invalidateUserCache(typedData.id)
					}
				})
				break

			default:
				throw new Error(`Invalid cache worker job name: ${name}`)
		}
	},
	{
		connection: redisConnection,
		limiter: { max: 1000, duration: 1000 * 60 * 2 }
	}
)

export enum CacheJob {
	CacheUser = 'cacheUserJob',
	InvalidateUserCache = 'invalidateUserCacheJob'
}

type CacheUserJobData = UserPlainObject
type CacheInvalidateUserCacheJobData = string
type CacheJobsDataTypes = CacheUserJobData | CacheInvalidateUserCacheJobData

export type CacheJobsData = {
	[CacheJob.CacheUser]: CacheUserJobData
	[CacheJob.InvalidateUserCache]: CacheInvalidateUserCacheJobData
}

export type CacheQueue = Queue<CacheJobsDataTypes, void, CacheJob>
export type CacheQueueWorker = Worker<CacheJobsDataTypes, void, CacheJob>
