import { cacheService } from '../app/cache'
import { CACHE_EVENTS } from '../app/cache/service'
import { eventEmitter } from '../lib'

eventEmitter.on(
	CACHE_EVENTS.invalidateUserCache,
	cacheService.invalidateUserCache
)
