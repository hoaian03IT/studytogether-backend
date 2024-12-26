const logger = require("../../config/logger.js");

function logUserActivity(req, res, next) {
	const user = req.user?.["user id"] || "Anonymous"; // Assuming `req.user` contains user details
	const activity = {
		user,
		method: req.method,
		path: req.originalUrl,
		timestamp: new Date().toISOString(),
	};

	logger.info("User Activity:", activity);
	next();
}

module.exports = logUserActivity;
