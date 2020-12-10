import { MongooseSchemaDefinition } from '@yokita/common'
import { Schema } from 'mongoose'
import { UserCode, UserName } from '../typings'

const userNameSchemaDefinition: MongooseSchemaDefinition<UserName> = {
	first: {
		type: String,
		required: true
	},
	middle: String,
	last: {
		type: String,
		required: true
	}
}

export const userNameSchema = new Schema(userNameSchemaDefinition, {
	_id: false,
	id: false
})

const userCodeSchemaDefinition: MongooseSchemaDefinition<UserCode> = {
	value: {
		type: String,
		required: true
	},
	expiration: {
		type: Date,
		validate: [
			{
				validator: (val: Date) => val.getTime() > Date.now(),
				message: "A code's expiration date must be in the future"
			}
		]
	}
}

export const userCodeSchema = new Schema(userCodeSchemaDefinition, {
	_id: false,
	id: false
})
