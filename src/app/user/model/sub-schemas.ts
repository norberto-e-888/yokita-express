import { MongooseSchemaDefinition } from '@yokita/common'
import { Schema } from 'mongoose'
import { UserCode, UserName, UserPhone } from '../typings'

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

const userPhoneSchemaDefinition: MongooseSchemaDefinition<UserPhone> = {
	value: {
		type: String,
		required: true
	},
	prefix: {
		type: String,
		required: true,
		validate: [{ validator: (val: string) => val.charAt(0) === '+' }]
	}
}

export const userPhoneSchema = new Schema(userPhoneSchemaDefinition, {
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
