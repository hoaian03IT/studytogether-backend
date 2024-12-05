const { pool } = require("../../connectDB");
const { CommonHelpers } = require("../helpers/commons");

class NotificationController {
	static async createNotificationCourseRegistration(enrollmentId) {
		let conn;
		try {
			conn = await pool.getConnection();
			let responseSql = await conn.query("CALL SP_GetRelatedEnrollmentInfo(?)", [enrollmentId]);


			let responseSql2 = await conn.query("CALL SP_CreateNotification(?, ?, 'course-registration', ?, ?)",
				[responseSql[0][0][0]?.["owner course user id"], "COURSE_REGISTRATION", responseSql[0][0][0]?.name, responseSql[0][0][0]?.["enrollment username"]]);

			return {
				notificationId: responseSql2[0][0][0]?.["notification id"],
				ownerUsername: responseSql[0][0][0]?.["owner course username"],
			};
		} catch (error) {
			console.error(error);
			return null;
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	static async createNotificationStreak(userId, currentStreak) {
		let conn;
		try {
			conn = await pool.getConnection();
			let responseSql2 = await conn.query("CALL SP_CreateNotification(?, ?, 'system', ?, ?)",
				[userId, currentStreak > 0 ? "KEEP_STREAK" : "MISSING", currentStreak > 0 ? `${currentStreak} ${currentStreak > 1 ? "days" : "day"}` : "", ""]);

			return {
				notificationId: responseSql2[0][0][0]?.["notification id"],
				ownerUsername: userId,
			};
		} catch (error) {
			console.error(error);
			return null;
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	static async getNotification(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "notification-id": notificationId } = req.query;
			const { "user id": userId } = req.user;
			let responseSql = await conn.query("CALL SP_GetNotification(?, ?)", [userId, notificationId]);
			res.status(200).json({ ...responseSql[0][0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	static async getAllNotifications(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { li = 5, np = 1 } = req.query;
			let responseSql = await conn.query("CALL SP_GetAllNotfication(?,?,?)", [userId, li, np]);
			res.status(200).json({ notifications: Array.from(Object.values(responseSql[0][0])) });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}
}

module.exports = { NotificationController };