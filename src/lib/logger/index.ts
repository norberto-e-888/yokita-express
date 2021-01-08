import {
	format,
	transports,
	createLogger,
	addColors,
	config,
	Logger,
	LeveledLogMethod
} from 'winston'
import env from '../../env'

const customConfig: {
	levels: config.AbstractConfigSetLevels
	colors: config.AbstractConfigSetColors
} = {
	levels: {
		error: 0,
		warning: 1,
		info: 2,
		debug: 3,
		trivial: 4
	},
	colors: {
		error: 'bold red',
		warning: 'bold yellow',
		info: 'bold green',
		debug: 'bold cyan',
		trivial: 'bold gray'
	}
}

const customConsoleFormat = format.printf(
	({ level, message, label, timestamp }) =>
		`${timestamp} [${label}] ${level}: ${message}`
)

const customFileFormat = format.printf(
	({ message, timestamp }) => `${timestamp} 💥 ${JSON.stringify(message)}`
)

const logger = <CustomLeveledWinstonLogger>createLogger({
	levels: customConfig.levels,
	format: format.combine(format.splat()),
	transports: [
		new transports.Console({
			level: env.nodeEnv === 'development' ? 'trivial' : 'warning',
			format: format.combine(
				format.timestamp({ format: 'hh:mm:ss' }),
				format.colorize(),
				format.label({ label: 'Boilerplate' }),
				customConsoleFormat
			)
		}),
		new transports.File({
			level: 'error',
			format: format.combine(
				format.timestamp({ format: 'MM/DD/YY @ hh:mm:ss' }),
				format.errors({ stack: true }),
				customFileFormat
			),
			filename: 'src/logs/errors.log'
		})
	]
})

addColors(customConfig.colors)

export default logger

interface CustomLeveledWinstonLogger extends Logger {
	error: LeveledLogMethod
	warning: LeveledLogMethod
	info: LeveledLogMethod
	debug: LeveledLogMethod
	trivial: LeveledLogMethod
}
