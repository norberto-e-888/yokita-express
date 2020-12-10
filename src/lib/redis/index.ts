import redis from 'redis'

const client = redis.createClient()

client.on('error', function (error) {
	console.error(error)
})

export default client
