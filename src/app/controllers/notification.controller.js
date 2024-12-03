const { pool } = require("../../connectDB");
const { CommonHelpers } = require("../helpers/commons");

class NotificationController {
	static async createNotificationCourseRegistration(userId, courseId) {
		let conn;
		try {
			conn = await pool.getConnection();

			conn.query("CALL ");
		} catch (error) {
			console.error(error);
		} finally {
			pool.releaseConnection(conn);
		}
	}
}