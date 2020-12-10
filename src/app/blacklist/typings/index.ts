import { CommonProperties, DocumentReference } from '@yokita/common'
import { Document, Model, Types } from 'mongoose'

export interface BlacklistEntry extends CommonProperties {
	user: DocumentReference
	ips: string[]
}

export interface BlacklistEntryDocument extends BlacklistEntry, Document {
	_id: Types.ObjectId
	id: string
	__v: number
}

export interface BlacklistEntryModel extends Model<BlacklistEntryDocument> {}
export type BlacklistEntryPlainObject = Omit<BlacklistEntry, '_id' | '__v'>
export type BlacklistEntryCreateDTO = {
	user: string
	ips: [string]
}
