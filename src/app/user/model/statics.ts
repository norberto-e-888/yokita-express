import { AppError } from '@yokita/common'
import { UserStaticIsEmailInUser } from '../typings'

export const isEmailInUse: UserStaticIsEmailInUser = async function (
	email,
	{ throwIfExists = true } = {
		throwIfExists: true
	}
) {
	const user = await this.findOne({
		email
	})

	if (user && throwIfExists) {
		throw new AppError(`"${email}" is already in use`, 400)
	}

	return !!user
}
