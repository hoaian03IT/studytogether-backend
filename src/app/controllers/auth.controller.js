const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { pool } = require("../../db/connectDB.js");
const { transporter } = require("../../config/nodemailer.js");
const { validation } = require("../../utils/inputValidations.js");
const { generatePassword } = require("../../utils/passwordGenerate.js");
const { google } = require("googleapis");
const { default: axios } = require("axios");
const { CommonHelpers } = require("../helpers/commons");
const { AuthHelper } = require("../helpers/auth.helper");
const { redisConfig } = require("../../redis/config.js");

const oauth2Client = new google.auth.OAuth2();

class Auth {
	async login(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { usernameOrEmail, password } = req.body;

			if (!validation.email(usernameOrEmail) && !validation.username(usernameOrEmail)) {
				return res.status(401).json({ errorCode: "INVALID_ACCOUNT" });
			}

			if (!validation.password(password)) {
				return res.status(401).json({ errorCode: "INVALID_PASSWORD" });
			}

			conn.query("CALL SP_GetUserAccount(?)", [usernameOrEmail])
				.then(async ([result]) => {
					const userInfo = result[0][0];
					const isMatchP = await bcrypt.compare(password, userInfo["hashpassword"]);
					if (!isMatchP) {
						res.status(401).json({ errorCode: "INCORRECT_ACCOUNT/PASSWORD" });
						return;
					}
					const { accessToken, refreshToken, maxAge } = await AuthHelper.generateTokens(userInfo, conn);

					const { hashpassword, "user id": id, ...rest } = { ...userInfo, token: accessToken };

					res.cookie("refresh_token", refreshToken, {
						maxAge: maxAge,
						httpOnly: true,
						secure: true,
					})
						.status(200)
						.json({ ...rest, messageCode: "LOGIN_SUCCESS" });
				})
				.catch((err) => {
					CommonHelpers.handleError(err, res);
				});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async register(req, res) {
		let conn;
		try {
			const { email, password, role } = req.body;

			if (!validation.email(email)) {
				return res.status(401).json({ errorCode: "INVALID_ACCOUNT" });
			}

			if (!validation.password(password)) {
				return res.status(401).json({ errorCode: "INVALID_PASSWORD" });
			}

			let username = email.split("@")[0];
			const hashedPassword = await AuthHelper.convertHashedPassword(password);

			conn = await pool.getConnection();

			let [records] = await conn.query("SELECT `user id` FROM users WHERE username=? ORDER BY `user id` LIMIT 1", [username]);

			if (records.length > 0) {
				username = AuthHelper.generateUsername(email);
			}

			// posix: chuyển thành dấu "/" thay vì "\"
			const imagePath = `${process.env.SERVER_URL}/static/default-avatar/default-avatar-0.jpg`;

			conn.query("CALL SP_CreateUserAccount(?,?,?,?,?,?,?,?,?)", [email, hashedPassword, username, imagePath, role, null, null, null, null])
				.then(async ([response]) => {
					const userInfo = response[0][0];

					const { accessToken, refreshToken, maxAge } = await AuthHelper.generateTokens(userInfo, conn);

					const { hashpassword, "user id": id, ...rest } = { ...userInfo, token: accessToken };

					res.cookie("refresh_token", refreshToken, {
						maxAge: maxAge,
						httpOnly: true,
						secure: true,
					})
						.status(200)
						.json({ ...rest, messageCode: "REGISTER_SUCCESS" });
				})
				.catch((err) => {
					CommonHelpers.handleError(err, res);
				});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async logout(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const refreshToken = req.cookies["refresh_token"];
			const { "user id": userId } = req.user;

			let result = await redisConfig.get(`${userId}:refreshtoken:${refreshToken}`);

			if (!result) {
				return res.status(403).json({ errorCode: "UNAUTHENTICATED" });
			}

			await redisConfig.del(`${userId}:refreshtoken:${refreshToken}`);

			res.clearCookie("refresh_token").status(200).json({ messageCode: "LOGOUT_SUCCESS" });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async refreshToken(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			// lấy token từ cookies client
			const refreshToken = req.cookies["refresh_token"];

			jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, userInfo) => {
				if (err) {
					console.error(err);
					return;
				}
				// kiểm tra xem token đã hết hạn chưa
				let result = await redisConfig.get(`${userInfo["user id"]}:refreshtoken:${refreshToken}`);

				if (!result) {
					return res.status(403).json({ errorCode: "UNAUTHENTICATED" });
				}
				// xoa refreshtoken khoi redis
				await redisConfig.del(`${userInfo["user id"]}:refreshtoken:${refreshToken}`);

				const { accessToken, refreshToken: newRefreshToken, maxAge } = await AuthHelper.generateTokens(userInfo, conn);

				res.cookie("refresh_token", newRefreshToken, {
					maxAge: maxAge,
					httpOnly: true,
					secure: true,
				})
					.status(200)
					.json({ messageCode: "REFRESH_TOKEN", token: accessToken });
			});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async forgotPassword(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			let { email } = req.body;
			email = email.trim();

			if (!validation.email(email)) {
				return res.status(401).json({ errorCode: "INVALID_EMAIL" });
			}

			const newPassword = generatePassword();
			const newHashedPassword = await AuthHelper.convertHashedPassword(newPassword);

			conn.query("CALL SP_GetNewPassword(?, ?)", [newHashedPassword, email])
				.then(async () => {
					const info = transporter.sendMail({
						from: {
							name: "StudyTogether😊",
							address: process.env.NODEMAILER_USER,
						}, // sender address
						to: email, // list of receivers
						subject: "Your new password", // Subject line
						text: "Hello, guys. We are StudyTogether", // plain text body
						html: `<!DOCTYPE html>
								<html lang="en">
								<head>
									<meta charset="UTF-8">
									<meta name="viewport" content="width=device-width, initial-scale=1.0">
									<title>StudyTogether - Password Reset</title>
									<style>
										body {
											font-family: 'Arial', sans-serif;
											line-height: 1.6;
											background-color: #f4f4f4;
											margin: 0;
											padding: 0;
											color: #333;
										}
										.email-container {
											max-width: 600px;
											margin: 20px auto;
											background-color: white;
											border-radius: 8px;
											box-shadow: 0 4px 6px rgba(0,0,0,0.5);
											overflow: hidden;
										}
										.email-header {
											background-color: #5cc6ee;
											color: white;
											text-align: center;
											padding: 20px;
										}
										.email-header h1 {
											margin: 0;
											font-size: 24px;
										}
										.email-body {
											padding: 30px;
										}
										.password-box {
											background-color: #F3F4F6;
											border: 2px dashed #5cc6ee;
											text-align: center;
											padding: 20px;
											margin: 20px 0;
											border-radius: 8px;
										}
										.password-box strong {
											font-size: 24px;
											color: #FF6636;
											letter-spacing: 2px;
										}
										.email-footer {
											background-color: #5cc6ee;
											text-align: center;
											padding: 15px;
											font-size: 12px;
											color: #6B7280;
										}
										.cta-button {
											display: inline-block;
											background-color: #5cc6ee;
											color: white;
											padding: 12px 24px;
											text-decoration: none;
											border-radius: 5px;
											margin-top: 20px;
										}
										.cta-button:hover {
											color: white;
										}
									</style>
								</head>
								<body>
									<div class="email-container">
										<div class="email-header">
											<h1>StudyTogether</h1>
										</div>
										<div class="email-body">
											<h2>Password Reset</h2>
											<p>Hello User,</p>
											<p>We received a request to reset your password. Here's your new temporary password:</p>
											
											<div class="password-box">
												<strong>${newPassword}</strong>
											</div>
											
											<p>Please log in with this temporary password and change it immediately in your account settings.</p>
											
											<a href="${process.env.CLIENT_URL1 + process.env.CLIENT_LOGIN_PATHNAME}" class="cta-button">Log In to StudyTogether</a>
											
											<p style="margin-top: 20px;">If you did not request a password reset, please contact our support team.</p>
										</div>
										<div class="email-footer">
											© 2024 StudyTogether. All rights reserved.
											<br>
											This is an automated email. Please do not reply.
										</div>
									</div>
								</body>
								</html>`,
					});
					res.status(200).json({ messageCode: "RESET_PW_SUCCESS" });
				})
				.catch((error) => {
					if (error.sqlState == 45000) {
						res.status(406).json({ errorCode: "EMAIL_NOT_FOUND" });
					} else {
						res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
					}
				});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async changePassword(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;

			const { currentPassword, newPassword } = req.body;

			if (!validation.password(currentPassword) || !validation.password(newPassword)) {
				return res.status(406).json({ errorCode: "INVALID_PASSWORD" });
			}

			const [result] = await conn.query("SELECT  `user id`, hashpassword FROM users WHERE `user id`=?", [userId]);

			if (result.length === 0) {
				return res.status(404).json({ errorCode: "USER_NOT_FOUND" });
			}

			const isMatch = await bcrypt.compare(currentPassword, result[0].hashpassword);
			if (!isMatch) {
				return res.status(406).json({ errorCode: "INCORRECT_PASSWORD" });
			}

			const newHashedPassword = await AuthHelper.convertHashedPassword(newPassword);
			await conn.query("UPDATE users SET hashpassword=? WHERE `user id`=?", [newHashedPassword, userId]);

			res.status(200).json({ messageCode: "CHANGE_PASSWORD_SUCCESS" });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async googleLogin(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();

			const { token, role } = req.body;
			oauth2Client.setCredentials({ access_token: token });

			const oauth2 = google.oauth2({
				auth: oauth2Client,
				version: "v2",
			});

			const { data } = await oauth2.userinfo.get();

			const { email, given_name, family_name, picture, id: sub } = data;
			// check nếu đã có tài khoản...
			conn.query("CALL SP_GetUserAccountByGoogleId(?,?)", [email, sub])
				.then(async (response) => {
					const userInfo = response[0][0][0];
					const { accessToken, refreshToken, maxAge } = await AuthHelper.generateTokens(userInfo, conn);

					const { hashpassword, "user id": id, ...rest } = { ...userInfo, token: accessToken };

					res.cookie("refresh_token", refreshToken, {
						maxAge: maxAge,
						httpOnly: true,
						secure: true,
					})
						.status(200)
						.json({ ...rest, message: "login" });
				})
				.catch(async (err) => {
					// if (err.sqlState >= 45000) return res.status(401).json({ messageCode: err.sqlMessage });
					// trường hợp procedure báo lỗi không có tài khoản thì tạo
					if (!role) return res.status(401).json({ errorCode: "REGISTER_FIRST" });

					let username = email.split("@")[0];

					let [records] = await conn.query("SELECT 1 FROM users WHERE username=? ORDER BY `user id` LIMIT 1", [username]);

					if (records.length > 0) {
						username = AuthHelper.generateUsername(email);
					}

					const hashedPassword = await AuthHelper.convertHashedPassword(sub);
					conn.query("CALL SP_CreateUserAccount(?,?,?,?,?,?,?,?,?)", [
						email,
						hashedPassword,
						username,
						picture,
						role,
						given_name,
						family_name,
						sub,
						null,
					])
						.then(async ([response]) => {
							const userInfo = response[0][0];

							const { accessToken, refreshToken, maxAge } = await AuthHelper.generateTokens(userInfo, conn);

							const { hashpassword, "user id": id, ...rest } = { ...userInfo, token: accessToken };

							res.cookie("refresh_token", refreshToken, {
								maxAge: maxAge,
								httpOnly: true,
								secure: true,
							})
								.status(200)
								.json({ ...rest, messageCode: "REGISTER_SUCCESS" });
						})
						.catch((err) => {
							CommonHelpers.handleError(err, res);
						});
				});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async facebookLogin(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();

			const { token, role } = req.body;

			// Facebook Graph API URL with token
			const url = `https://graph.facebook.com/me?access_token=${token}&fields=id,email,first_name,last_name,picture`;

			const response = await axios.get(url, { withCredentials: true });
			const { id: idFB, email, first_name, last_name, picture } = response.data;

			conn.query("CALL SP_GetUserAccountByFacebookId(?,?)", [email, idFB])
				.then(async ([response]) => {
					const userInfo = response[0][0];
					const { accessToken, refreshToken, maxAge } = await AuthHelper.generateTokens(userInfo, conn);

					const { hashpassword, "user id": id, ...rest } = { ...userInfo, token: accessToken };

					res.cookie("refresh_token", refreshToken, {
						maxAge: maxAge,
						httpOnly: true,
						secure: true,
					})
						.status(200)
						.json({ ...rest, messageCode: "LOGIN_SUCCESS" });
				})
				.catch(async (err) => {
					if (err.sqlState != 45000) return res.status(401).json({ message: err.message });
					// trường hợp procedure báo lỗi không có tài khoản thì tạo
					if (!role) return res.status(401).json({ errorCode: "REGISTER_FIRST" });

					let username = email.split("@")[0];

					let [records] = await conn.query("SELECT 1 FROM users WHERE username=? ORDER BY `user id` LIMIT 1", [username]);

					if (records.length > 0) {
						username = AuthHelper.generateUsername(email);
					}

					const hashedPassword = await AuthHelper.convertHashedPassword(idFB);
					conn.query("CALL SP_CreateUserAccount(?,?,?,?,?,?,?,?,?)", [
						email,
						hashedPassword,
						username,
						picture.data.url,
						role,
						first_name,
						last_name,
						null,
						idFB,
					])
						.then(async ([response]) => {
							const userInfo = response[0][0];

							const { accessToken, refreshToken, maxAge } = await AuthHelper.generateTokens(userInfo, conn);

							const { hashpassword, "user id": id, ...rest } = { ...userInfo, token: accessToken };

							res.cookie("refresh_token", refreshToken, {
								maxAge: maxAge,
								httpOnly: true,
								secure: true,
							})
								.status(200)
								.json({ ...rest, messageCode: "REGISTER_SUCCESS" });
						})
						.catch((err) => {
							CommonHelpers.handleError(err, res);
						});
				});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}
}

module.exports = new Auth();
