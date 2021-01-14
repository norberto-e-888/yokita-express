import { blacklistQueueScheduler } from './blacklist'
import { cacheQueueScheduler } from './cache'
import { EmailJob, emailQueue, emailQueueScheduler } from './email'
import { smsQueueScheduler } from './sms'

export async function configureQueues(): Promise<void> {
	await blacklistQueueScheduler.waitUntilReady()
	await cacheQueueScheduler.waitUntilReady()
	await emailQueueScheduler.waitUntilReady()
	await smsQueueScheduler.waitUntilReady()
	await emailQueue.add(EmailJob.SendErrorsToAdmins, undefined, {
		repeat: { cron: '0 0 0 * * ?' },
		attempts: 3
	})
}

export * from './blacklist'
export * from './cache'
export * from './email'
export * from './sms'
