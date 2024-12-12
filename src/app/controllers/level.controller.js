const { pool } = require("../../db/connectDB.js");
const { CommonHelpers } = require("../helpers/commons");

class LevelControllerClass {
	async getAllLevels(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId } = req.params;

			if (!courseId) {
				// COURSE_NOT_FOUND: không tìm thấy khoá phù hợp hoặc không sở hữu khoá này
				return res.status(404).json({ errorCode: "COURSE_NOT_FOUND" });
			}

			let response = await conn.query("CALL SP_GetOwnCourseLevels(?,?)", [courseId, userId]);
			res.status(200).json({ levels: response[0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async addNewCourseLevel(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId, levelName } = req.body;

			if (!courseId || !levelName) {
				// MISS_PARAMETER: Thiếu tham số
				return res.status(404).json({ errorCode: "MISS_PARAMETER" });
			}

			let response = await conn.query("CALL SP_InsertNewCourseLevel(?,?,?)", [courseId, userId, levelName]);
			res.status(200).json({ newLevel: response[0][0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async updateCourseLevel(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId, levelId, levelName } = req.body;

			if (!courseId || !levelName || !levelId) {
				// MISS_PARAMETER: Thiếu tham số
				return res.status(404).json({ errorCode: "MISS_PARAMETER" });
			}

			let response = await conn.query("CALL SP_UpdateCourseLevel(?,?,?,?)", [courseId, userId, levelId, levelName]);
			res.status(200).json({ updatedLevel: response[0][0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async deleteCourseLevel(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { "course-id": courseId, "level-id": levelId } = req.query;

			if (!courseId || !levelId) {
				// MISS_PARAMETER: Thiếu tham số
				return res.status(404).json({ errorCode: "MISS_PARAMETER" });
			}

			await conn.query("CALL SP_DisableCourseLevel(?,?,?)", [courseId, userId, levelId]);
			res.status(200).json({ messageCode: "DELETE_COURSE_SUCCESS" });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}
}

const LevelController = new LevelControllerClass();

module.exports = LevelController;
