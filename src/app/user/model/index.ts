import { Schema, model } from 'mongoose'
import { MongooseSchemaDefinition } from '@yokita/common'
import {
	userNameSchemaDefinition,
	userCodeSchema,
	userPhoneSchemaDefinition
} from './sub-schemas'
import { handlePreSave } from './hooks'
import { isEmailInUse } from './statics'
import {
	setCode,
	isPasswordValid,
	verifyInfo,
	resetPassword,
	isCodeValid,
	sendVerification
} from './methods'
import { User, UserDocument, UserModel, UserRole } from '../typings'
import { VALID_EMAIL_REGEX } from '../../../constants'

const userSchemaDefinition: MongooseSchemaDefinition<User> = {
	name: userNameSchemaDefinition,
	email: {
		type: String,
		match: VALID_EMAIL_REGEX,
		required: true,
		trim: true,
		unique: true
	},
	phone: {
		type: userPhoneSchemaDefinition,
		required: false
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
	password: {
		type: String,
		minlength: 8,
		maxlength: 16,
		trim: true,
		required: true
	},
	role: {
		type: String,
		required: true,
		enum: Object.values(UserRole),
		default: UserRole.EndUser
	},
	isEmailVerified: {
		type: Boolean,
		default: false
	},
	isPhoneVerified: {
		type: Boolean,
		default: false,
		set: function (this: UserDocument, val: boolean) {
			if (!this.phone) return false
			return val
		}
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
	twoFactorAuthCode: {
		type: userCodeSchema
	},
	isBlocked: {
		type: Boolean,
		default: false
	},
	is2FAEnabled: {
		type: Boolean,
		default: false,
		set: function (this: UserDocument, val: boolean) {
			if (!this.phone || !this.isPhoneVerified) return false
			return val
		}
	},
	is2FALoginOnGoing: {
		type: Boolean,
		default: false,
		set: function (this: UserDocument, val: boolean) {
			if (!this.phone || !this.isPhoneVerified || !this.is2FAEnabled)
				return false

			return val
		}
	},
	refreshToken: String
}

const userSchema = new Schema(userSchemaDefinition, {
	id: true,
	toObject: {
		virtuals: true,
		getters: true,
		transform: (_: UserDocument, obj: User): Partial<User> => ({
			...obj,
			password: undefined,
			refreshToken: undefined,
			emailVerificationCode: undefined,
			phoneVerificationCode: undefined,
			passwordResetCode: undefined,
			twoFactorAuthCode: undefined,
			_id: undefined,
			__v: undefined
		})
	},
	timestamps: {
		createdAt: 'timestamps.createdAt',
		updatedAt: 'timestamps.updatedAt'
	}
})

userSchema.index(
	{ 'phone.prefix': 1, 'phone.value': 1 },
	{ unique: true, sparse: true }
)

userSchema.pre('save', handlePreSave)

userSchema.statics.isEmailInUse = isEmailInUse
userSchema.methods.setCode = setCode
userSchema.methods.isCodeValid = isCodeValid
userSchema.methods.isPasswordValid = isPasswordValid
userSchema.methods.verifyInfo = verifyInfo
userSchema.methods.sendVerification = sendVerification
userSchema.methods.resetPassword = resetPassword

export default model<UserDocument, UserModel>('User', userSchema)
