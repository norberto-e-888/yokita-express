import { blacklistQueueScheduler } from './blacklist'
import { cacheQueueScheduler } from './cache'
import { emailQueueScheduler } from './email'
import { smsQueueScheduler } from './sms'

export async function configureQueues(): Promise<void> {
	await blacklistQueueScheduler.waitUntilReady()
	await cacheQueueScheduler.waitUntilReady()
	await emailQueueScheduler.waitUntilReady()
	await smsQueueScheduler.waitUntilReady()
}

export * from './blacklist'
export * from './cache'
export * from './email'
export * from './sms'
