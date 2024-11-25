const { pool } = require("../../connectDB");

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
			console.error(error);

			if (error?.sqlState >= 45000) {
				res.status(404).json({ errorCode: error?.sqlMessage });
			} else {
				res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
			}
		} finally {
			pool.releaseConnection(conn);
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
			console.error(error);
			res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
		} finally {
			pool.releaseConnection(conn);
		}
	}
}

module.exports = new EnrollmentController();
