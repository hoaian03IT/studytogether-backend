const { transporter } = require("../../config/nodemailer.js");
const { pool } = require("../../db/connectDB.js");
const { uploadImage } = require("../../utils/uploadToCloud");
const { CommonHelpers } = require("../helpers/commons");

class User {
	async getUserInfo(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { email } = req.user;

			conn.query("CALL SP_GetUserAccount(?)", [email])
				.then((response) => {
					const { hashpassword, "user id": id, ...rest } = response[0][0][0];
					res.status(200).json({ ...rest });
				})
				.catch((error) => {
					res.status(500).json(error.message);
				});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
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
				if (!urlRegex.test(avatarBase64)) avatarBase64 = await uploadImage(avatarBase64, []);
			}

			let responseSql = await conn.query("CALL SP_UpdateUserInfo(?,?,?,?,?,?)", [userId, firstName, lastName, phone, username, avatarBase64]);
			res.status(200).json({ updatedInfo: responseSql[0][0][0], messageCode: "UPDATE_SUCCESS" });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async checkExistUsername(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { username } = req.query;

			let responseSql = await conn.query("SELECT 1 FROM users WHERE username=?", [username]);
			if (responseSql[0].length === 0) res.status(200).json({});
			else res.status(404).json({});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async getUserList(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { li = 20, np = 1, "sort-by": sortBy = null, "sort-direction": sortDirection = null, "role-id": roleId = null, username = "" } = req.query;

			const enumSortBy = ["spent", "created_course", "number_enrollment"];
			const enumSortDirection = ["ASC", "DESC"];

			let responseSql = await conn.query("CALL SP_AdminViewListUser(?,?,?,?,?,?)", [
				Number(li),
				Number(np),
				sortBy === "" ? null : sortBy,
				sortDirection === "" ? null : sortDirection,
				roleId === "" ? null : roleId,
				username,
			]);
			res.status(200).json({ users: responseSql[0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async disableUser(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { userId, reasonContent } = req.body;
			let defaultReason = "It looks like some of your behaviors violated our policies.";
			let response = await conn.query("CALL SP_AdminDisableUser(?)", [userId]);
			transporter.sendMail({
				from: {
					name: "StudyTogether😊",
					address: process.env.NODEMAILER_USER,
				}, // sender address
				to: response[0][0][0]?.["email"], // list of receivers
				subject: "Your account was disabled ❌", // Subject line
				text: "Hello, my friend. Your account was disabled with some reasons", // plain text body
				html: `
					<!DOCTYPE html>
					<html lang="en">
					<head>
						<meta charset="UTF-8" />
						<meta name="viewport" content="width=device-width, initial-scale=1.0" />
						<link rel="stylesheet" href="src/style.css" />
					</head>
					<body>
						<div
						class="email-container"
						style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;"
						>
						<div
							class="header"
							style="background: #f44336; color: white; padding: 20px; text-align: center;">
							<h1>Your account was disabled</h1>
						</div>
						<div class="course-info" style="padding: 20px; background: #fff;">
							<div
							class="course-header"
							style="display: flex; gap: 20px; margin-bottom: 20px;"
							>
							
							<div class="course-details">
								<div class="course-tags" style="margin-bottom: 10px;">
								<span
									class="tag"
									style="background: #e0e0e0; padding: 5px 10px; border-radius: 15px; margin-right: 5px;"
								>
									<strong>Username:</strong> ${response[0][0][0]?.["username"]}
								</span>
								<span
									class="tag"
									style="background: #e0e0e0; padding: 5px 10px; border-radius: 15px; margin-right: 5px;"
								>
									<strong>Full name:</strong> ${response[0][0][0]?.["first name"]} ${response[0][0][0]?.["last name"]}
								</span>
								</div>
							</div>
							</div>
							<h3 style="color: #f44336; margin-top: 0;">Reason for rejection:</h3>
							<p>${reasonContent || defaultReason}</p>
							</div>
							<div
							class="footer"
							style="margin-top: 30px; text-align: center; color: #666;"
							>
							<p>
								If you have any questions, please contact us via email:
								${process.env.NODEMAILER_USER}
							</p>
							</div>
						</div>
						</div>
					</body>
					</html>`,
			});
			res.status(200).json({ messageCode: "DISABLE_USER_SUCCESS" });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async enableUser(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { userId } = req.body;

			let defaultReason =
				"Congratulation! .After considering, we decided to enable your account. Let's continue to learn more and improve your languages";

			let response = await conn.query("CALL SP_AdminEnableUser(?)", [userId]);
			transporter.sendMail({
				from: {
					name: "StudyTogether😊",
					address: process.env.NODEMAILER_USER,
				}, // sender address
				to: response[0][0][0]?.["email"], // list of receivers
				subject: "Your account was enabled 😘", // Subject line
				text: "Hello, my friend. Your account was enabled. Let's continue to learn", // plain text body
				html: `
					<!DOCTYPE html>
					<html lang="en">
					<head>
						<meta charset="UTF-8" />
						<meta name="viewport" content="width=device-width, initial-scale=1.0" />
						<link rel="stylesheet" href="src/style.css" />
					</head>
					<body>
						<div
						class="email-container"
						style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;"
						>
						<div
							class="header"
							style="background:#36b8f4; color: white; padding: 20px; text-align: center;">
							<h1>Your account was disabled</h1>
						</div>
						<div class="course-info" style="padding: 20px; background: #fff;">
							<div
							class="course-header"
							style="display: flex; gap: 20px; margin-bottom: 20px;"
							>
							
							<div class="course-details">
								<div class="course-tags" style="margin-bottom: 10px;">
								<span
									class="tag"
									style="background: #e0e0e0; padding: 5px 10px; border-radius: 15px; margin-right: 5px;"
								>
									<strong>Username:</strong> ${response[0][0][0]?.["username"]}
								</span>
								<span
									class="tag"
									style="background: #e0e0e0; padding: 5px 10px; border-radius: 15px; margin-right: 5px;"
								>
									<strong>Full name:</strong> ${response[0][0][0]?.["first name"]} ${response[0][0][0]?.["last name"]}
								</span>
								</div>
							</div>
							</div>
							<h3 style="color: #36b8f4; margin-top: 0;">Reason for rejection:</h3>
							<p>${defaultReason}</p>
							</div>
							<div
							class="footer"
							style="margin-top: 30px; text-align: center; color: #666;"
							>
							<p>
								If you have any questions, please contact us via email:
								${process.env.NODEMAILER_USER}
							</p>
							</div>
						</div>
						</div>
					</body>
					</html>`,
			});
			res.status(200).json({ messageCode: "ENABLE_USER_SUCCESS" });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}
}

module.exports = new User();
