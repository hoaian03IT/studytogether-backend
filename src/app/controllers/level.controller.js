const { pool } = require("../../connectDB");
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

			conn.query("CALL SP_GetCourseLevels(?,?)", [courseId, userId])
				.then((response) => {
					res.status(200).json({ levels: response[0][0] });
				})
				.catch((error) => {
					if (error.sqlState == 45000) {
						// COURSE_NOT_FOUND: không tìm thấy khoá phù hợp hoặc không sở hữu khoá này
						res.status(404).json({ error: error.message });
					}
				});
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

			conn.query("CALL SP_InsertNewCourseLevel(?,?,?)", [courseId, userId, levelName])
				.then((response) => {
					res.status(200).json({ newLevel: response[0][0][0] });
				})
				.catch((error) => {
					if (error.sqlState == 45000) {
						// COURSE_NOT_FOUND: không tìm thấy khoá phù hợp hoặc không sở hữu khoá này
						res.status(404).json({ error: error.message });
					}
				});
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

			conn.query("CALL SP_UpdateCourseLevel(?,?,?,?)", [courseId, userId, levelId, levelName])
				.then((response) => {
					res.status(200).json({ updatedLevel: response[0][0][0] });
				})
				.catch((error) => {
					if (error.sqlState == 45000) {
						// COURSE_NOT_FOUND: không tìm thấy khoá phù hợp hoặc không sở hữu khoá này
						res.status(404).json({ error: error.message });
					} else if (error.sqlState == 45001) {
						// WAS_DELETED: Đã bị disabled
						res.status(404).json({ error: error.message });
					} else {
						res.status(500).json({ error: error.message });
					}
				});
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

			console.log(req.body);

			if (!courseId || !levelId) {
				// MISS_PARAMETER: Thiếu tham số
				return res.status(404).json({ errorCode: "MISS_PARAMETER" });
			}

			conn.query("CALL SP_DisableCourseLevel(?,?,?)", [courseId, userId, levelId])
				.then((response) => {
					res.status(200).json({ message: "Delete successfully" });
				})
				.catch((error) => {
					if (error.sqlState == 45000) {
						// COURSE_NOT_FOUND: không tìm thấy khoá phù hợp hoặc không sở hữu khoá này
						res.status(404).json({ error: error.message });
					}
				});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}
}

const LevelController = new LevelControllerClass();

module.exports = LevelController;
