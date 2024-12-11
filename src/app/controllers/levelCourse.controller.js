const { pool } = require("../../db/connectDB.js");
const { CommonHelpers } = require("../helpers/commons");

class LevelCourseControllerClass {
	async getLevelCourseByLanguage(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "language-id": languageId } = req.query;

			conn.query(
				"SELECT `language id`,`course level id`,`course level name`,description FROM `course levels` WHERE `language id`=? ORDER BY `course level name`",
				[languageId],
			)
				.then((response) => {
					res.status(200).json({ levelCourses: response[0] });
				})
				.catch((error) => {
					res.status(500).json({ message: error.message });
				});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}
}

module.exports = new LevelCourseControllerClass();
