import { MongooseInstanceHook } from '@yokita/common'
import brcrypt from 'bcryptjs'
import { cacheService } from '../../cache'
import { UserDocument } from '../typings'

export const handlePreSave: MongooseInstanceHook<UserDocument> = async function (
	next
) {
	if (this.isModified('password')) {
		this.password = await brcrypt.hash(this.password, 8)
	}

	if (this.isModified('phone') && this.phone) {
		this.sendVerification('phone')
	}

	if (this.isModified('email')) {
		this.sendVerification('email')
	}

	if (this.isModified()) {
		cacheService.cacheUser(this.toObject(), (err) => {
			if (err) {
				cacheService.invalidateUserCache(this.id)
			}
		})
	}

	next()
}
