const Redis = require("ioredis");

const redisConfig = new Redis({
	host: "localhost",
	port: 6379,
	db: 0, // Defaults to 0
	maxRetriesPerRequest: 50, // Increased retry limit
	connectTimeout: 10000, // 10-second connection timeout
	retryStrategy: (times) => {
		return Math.min(times * 50, 2000);
	},
});

module.exports = { redisConfig };
