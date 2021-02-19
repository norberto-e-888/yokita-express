import mongoose, { Mongoose } from 'mongoose';
import { Express } from 'express';
import env from '../env';
import main from '..';
import { UserDocument } from '../app/user';
import { authenticate, mockSignUp } from './helpers';
import { SignInDto, SignUpDto } from '../app/auth';

beforeAll(async () => {
	const connection = await mongoose.connect(env.db.mongoUri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		useFindAndModify: false,
	});

	const app = await main();
	global.app = app;
	global.connection = connection;
});

beforeEach(async () => {
	const { collections } = mongoose.connection;
	for (const collection of Object.values(collections)) {
		await collection.deleteMany({});
	}
});

afterAll(async () => {
	await mongoose.connection.close();
});

global.mockSignUp = mockSignUp;
global.authenticate = authenticate;

declare global {
	namespace NodeJS {
		interface Global {
			app: Express;
			connection: Mongoose;
			mockSignUp(dto: SignUpDto): Promise<UserDocument>;
			authenticate(
				dto: SignUpDto | SignInDto,
				type?: 'sign-in' | 'sign-up'
			): Promise<{ accessToken: Cookie; refreshToken: Cookie }>;
		}
	}
}

type Cookie = {
	value: string;
	flags: {
		HttpOnly: boolean;
	};
};
