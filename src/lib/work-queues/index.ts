import { blacklistQueueScheduler } from './blacklist'
import { emailQueueScheduler } from './email'

export async function configureQueues(): Promise<void> {
	await blacklistQueueScheduler.waitUntilReady()
	await emailQueueScheduler.waitUntilReady()
}

export * from './blacklist'
export * from './email'
