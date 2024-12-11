const mysql = require("mysql2/promise");
const fs = require("fs");
// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool({
	host: process.env.DB_HOST || "localhost",
	user: process.env.DB_USER || "root",
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
	waitForConnections: true,
	connectionLimit: 10,
	maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
	idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
	queueLimit: 0,
	enableKeepAlive: true,
	keepAliveInitialDelay: 0,

	ssl: {
		ca: fs.readFileSync("./src/db/certs/ca.pem"),
	},
});

module.exports = { pool };
