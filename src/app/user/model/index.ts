import { Schema, model } from 'mongoose'
import { MongooseSchemaDefinition } from '@yokita/common'
import { userNameSchema, userCodeSchema, userPhoneSchema } from './sub-schemas'
import { handlePreSave } from './hooks'
import { isEmailInUse } from './statics'
import { setCode, isPasswordValid, verifyInfo, resetPassword } from './methods'
import { User, UserDocument, UserModel, UserRole } from '../typings'
import { VALID_EMAIL_REGEX } from '../../../constants'

const userSchemaDefinition: MongooseSchemaDefinition<User> = {
	name: {
		type: userNameSchema,
		required: true
	},
	email: {
		type: String,
		match: VALID_EMAIL_REGEX,
		required: true,
		trim: true,
		unique: true
	},
	password: {
		type: String,
		minlength: 8,
		maxlength: 16,
		trim: true,
		required: true
	},
	phone: {
		type: userPhoneSchema
	},
	dob: {
		type: Date,
		validate: [
			{
				validator: (val: Date) => val.getTime() < Date.now(),
				message: 'Debes ser mayor a # años' // TODO validate relative to min age requirement
			}
		]
	},
	role: {
		type: String,
		required: true,
		enum: Object.values(UserRole),
		default: UserRole.Customer
	},
	isEmailVerified: {
		type: Boolean,
		default: false
	},
	isPhoneVerified: {
		type: Boolean,
		default: false
	},
	emailVerificationCode: {
		type: userCodeSchema
	},
	phoneVerificationCode: {
		type: userCodeSchema
	},
	passwordResetCode: {
		type: userCodeSchema
	},
	refreshToken: String,
	isBlocked: {
		type: Boolean,
		default: false
	}
}

const userSchema = new Schema(userSchemaDefinition, {
	id: true,
	toObject: {
		virtuals: true,
		getters: true,
		transform: (_: UserDocument, obj: User) => ({
			...obj,
			password: undefined,
			refreshToken: undefined,
			emailVerificationCode: undefined,
			phoneVerificationCode: undefined,
			passwordResetCode: undefined,
			isBlocked: undefined,
			_id: undefined,
			__v: undefined
		})
	},
	timestamps: {
		createdAt: 'timestamps.createdAt',
		updatedAt: 'timestamps.updatedAt'
	}
})

userSchema.pre('save', handlePreSave)

userSchema.statics.isEmailInUse = isEmailInUse
userSchema.methods.setCode = setCode
userSchema.methods.isPasswordValid = isPasswordValid
userSchema.methods.verifyInfo = verifyInfo
userSchema.methods.resetPassword = resetPassword

export default model<UserDocument, UserModel>('User', userSchema)
