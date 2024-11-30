const { pool } = require("../../connectDB");
const { CommonHelpers } = require("../helpers/commons");

class EnrollmentController {
	async createEnrollment(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId } = req.body;

			if (!courseId) {
				return res.status(404).json({ errorCode: "COURSE_NOT_FOUND" });
			}

			const responseSql = await conn.query("CALL SP_CreateEnrollment(?,?)", [courseId, userId]);
			res.status(200).json({ ...responseSql[0][0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async getEnrollmentInfo(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { "course-id": courseId } = req.query;

			if (!courseId) {
				return res.status(404).json({ errorCode: "NOT_FOUND" });
			}

			const responseSql = await conn.query("CALL SP_GetEnrollmentInfo(?,?)", [courseId, userId]);
			res.status(200).json({ ...responseSql[0][0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async stopEnrollment(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId } = req.body;

			let responseSql = await conn.query("CALL SP_StopEnrollment(?, ?)", [userId, courseId]);

			res.status(200).json({ messageCode: "COURSE_STOPPED" });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}
}

module.exports = new EnrollmentController();
