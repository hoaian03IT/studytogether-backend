const bcrypt = require("bcrypt");
const { generateAccessToken, generateRefreshToken } = require("../../utils/generateToken");
const crypto = require("crypto");

class AuthHelper {
	static async convertHashedPassword(password) {
		const saltRounds = 10;
		return await bcrypt.hash(password, saltRounds);
	}

	static async generateTokens(userInfo, conn) {
		const maxAge = 60 * 60 * 24 * 365 * 1000; // hạn 100 ngày (ms)
		const accessToken = generateAccessToken({ userId: userInfo["user id"], email: userInfo["email"] });
		const refreshToken = generateRefreshToken({
			userId: userInfo["user id"],
			email: userInfo["email"],
			expiresIn: maxAge / 1000, // hạn 100 ngày (s)
		});

		let expiredAt = new Date();
		expiredAt.setMilliseconds(expiredAt.getMilliseconds() + maxAge);

		// save refresh token to database
		conn.query("INSERT INTO `refresh tokens` (`user id`, token, `expired at`) VALUE (?, ?, ?);", [
			userInfo["user id"],
			refreshToken,
			expiredAt,
		]).catch((err) => {
			throw new Error(err);
		});
		return { refreshToken, accessToken, maxAge };
	}

	static generateUsername(email) {
		const hash = crypto.createHash("md5").update(email).digest("hex").slice(0, 6); // Take first 6 characters of the hash
		return `${email.split("@")[0]}_${hash}`;
	}
}

module.exports = { AuthHelper };