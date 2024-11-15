const { pool } = require("../../connectDB.js");
const { uploadImage } = require("../../utils/uploadToCloud");
const { v2: cloudinary } = require("cloudinary");

class User {
	async getUserInfo(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { email } = req.user;

			conn.query("CALL SP_GetUserAccount(?)", [email])
				.then(response => {
					const { hashpassword, "user id": id, ...rest } = response[0][0][0];
					res.status(200).json({ ...rest });
				})
				.catch(error => {
					res.status(500).json(error.message);
				});
		} catch (error) {
			res.status(500).json(error.message);
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async updateUserInfo(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			let { firstName, lastName, phone, username, avatarBase64 } = req.body;

			if (!username) {
				return res.status(406).json({ errorCode: "USERNAME_REQUIRED" });
			}

			if (!avatarBase64) {
				avatarBase64 = `${process.env.SERVER_URL}/static/default-avatar/default-avatar-0.jpg`;
			} else {
				const urlRegex = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
				if (!urlRegex.test(avatarBase64))
					avatarBase64 = await uploadImage(avatarBase64, []);
			}

			let responseSql = await conn.query("CALL SP_UpdateUserInfo(?,?,?,?,?,?)", [userId, firstName, lastName, phone, username, avatarBase64]);
			res.status(200).json({ updatedInfo: responseSql[0][0][0], messageCode: "UPDATE_SUCCESS" });
		} catch (error) {
			console.error(error);
			if (error.sqlState == 45000) {
				res.status(409).json({ errorCode: "UPDATE_USER_INFO_FAILED" });
			} else {
				res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
			}
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async checkExistUsername(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { username } = req.query;

			let responseSql = await conn.query("SELECT 1 FROM users WHERE username=?", [username]);
			if (responseSql[0].length === 0)
				res.status(200).json({});
			else
				res.status(404).json({});
		} catch (error) {
			console.error(error);
			res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
		} finally {
			pool.releaseConnection(conn);
		}
	}
}

module.exports = new User();
