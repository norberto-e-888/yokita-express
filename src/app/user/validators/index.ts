import { AppError } from '@yokita/common'
import joi from 'joi'

export const updateProfileDtoJoiSchema = joi.object({
	password: joi.string().required().min(8).max(16),
	updates: joi
		.object({
			name: joi.object({
				first: joi.string(),
				middle: joi.string().allow(''),
				last: joi.string()
			}),
			email: joi.string().email(),
			phone: joi.object({
				prefix: joi.string().custom((val: string) => {
					if (val.charAt(0) !== '+') {
						throw new AppError("A phone's prefix must start with '+'", 400)
					}

					const restOfChars = val.slice(1)
					if (!restOfChars.length || Number.isNaN(parseInt(restOfChars))) {
						throw new AppError(
							"A phone's prefix must start with '+' and be followed by at least 1 number",
							400
						)
					}

					return val
				}),
				value: joi.string().custom((val: string) => {
					if (Number.isNaN(parseInt(val))) {
						throw new AppError("A phone's value must be numeric", 400)
					}

					if (val.length < 6) {
						throw new AppError(
							"A phone's value must be at least 6 characters long",
							400
						)
					}

					return val
				})
			}),
			dob: joi.date()
		})
		.required()
})
