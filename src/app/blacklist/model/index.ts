import { MongooseSchemaDefinition } from '@yokita/common'
import { model, Schema, Types } from 'mongoose'
import {
	BlacklistEntry,
	BlacklistEntryDocument,
	BlacklistEntryModel
} from '../typings'

const blacklistEntrySchemaDefinition: MongooseSchemaDefinition<BlacklistEntry> = {
	user: {
		type: Types.ObjectId,
		required: true,
		unique: true,
		ref: 'User'
	},
	ips: {
		type: [String],
		required: true,
		validate: [
			{
				validator: (val: string[]) => !!val.length,
				message: "A blacklisted user's ips must contain at least one entry"
			}
		]
	}
}

const blacklistEntrySchema = new Schema(blacklistEntrySchemaDefinition, {
	id: true,
	toObject: {
		virtuals: true,
		getters: true,
		transform: (_: BlacklistEntryDocument, obj: BlacklistEntry) =>
			Object.assign(obj, { _id: undefined, __v: undefined })
	},
	timestamps: {
		createdAt: 'timestamps.createdAt',
		updatedAt: 'timestamps.updatedAt'
	}
})

export default model<BlacklistEntryDocument, BlacklistEntryModel>(
	'BlacklistEntry',
	blacklistEntrySchema,
	'blacklist'
)
