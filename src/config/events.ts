import { eventEmitter } from '../lib'
import { redisEvents, redisService } from '../services'

eventEmitter.on(redisEvents.addIPToBlacklist, redisService.handleBlacklist)
