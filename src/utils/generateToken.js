const jwt = require("jsonwebtoken");

function generateAccessToken({ userId, email }) {
	return jwt.sign({ "user id": userId, email: email }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: 180,
	});
}

function generateRefreshToken({ userId, email, expiresIn }) {
	return jwt.sign({ "user id": userId, email: email }, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: expiresIn,
	});
}

module.exports = {
	generateAccessToken,
	generateRefreshToken,
};
