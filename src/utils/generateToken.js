const jwt = require("jsonwebtoken");

function generateAccessToken({ userId, email, role }) {
	return jwt.sign(
		{
			"user id": userId,
			email: email,
			"role name": role,
		},
		process.env.ACCESS_TOKEN_SECRET,
		{
			expiresIn: 180,
		},
	);
}

function generateRefreshToken({ userId, email, role, expiresIn }) {
	return jwt.sign(
		{
			"user id": userId,
			email: email,
			"role name": role,
		},
		process.env.REFRESH_TOKEN_SECRET,
		{
			expiresIn: expiresIn,
		},
	);
}

module.exports = {
	generateAccessToken,
	generateRefreshToken,
};
