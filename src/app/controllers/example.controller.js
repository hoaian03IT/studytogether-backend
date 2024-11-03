const { pool } = require("../../connectDB");

class ExampleControllerClass {
	async getAllExamplesByCourse(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "course-id": courseId, "word-id": wordId } = req.query;
			const { "user id": userId } = req.user;

			if (!courseId) return res.status(404).json({ messageCode: "MISS_PARAMETER" });

			const queryString = wordId
				? `CALL SP_GetExampleByWord(${courseId},${userId},${wordId})`
				: `CALL SP_GetAllExample(${courseId},${userId})`;

			conn.query(queryString)
				.then((response) => {
					res.status(200).json({ examples: response[0][0] });
				})
				.catch((error) => {
					if (error.sqlState == 45000) {
						// COURSE_NOT_FOUND: không tìm thấy khoá phù hợp hoặc không sở hữu khoá này
						res.status(404).json({ messageCode: "COURSE_NOT_FOUND" });
					} else if (error.sqlState == 45001) {
						res.status(404).json({ messageCode: "WORD_NOT_FOUND" });
					} else {
						res.status(500).json({ error: error.message });
					}
				});
		} catch (error) {
			res.status(500).json({ message: error.message });
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async addNewExample(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { courseId, wordId, title, sentence, explanation } = req.body;
			const { "user id": userId } = req.user;

			if (!courseId || !wordId || !title || !sentence)
				return res.status(404).json({ messageCode: "MISS_PARAMETER" });

			conn.query("CALL SP_AddNewExample(?,?,?,?,?,?)", [courseId, userId, wordId, title, sentence, explanation])
				.then((response) => {
					res.status(200).json({ newExample: response[0][0][0] });
				})
				.catch((error) => {
					if (error.sqlState == 45001) {
						// COURSE_NOT_FOUND: không tìm thấy khoá phù hợp hoặc không sở hữu khoá này
						res.status(404).json({ messageCode: "WORD_NOT_FOUND" });
					} else {
						res.status(500).json({ error: error.message });
					}
				});
		} catch (error) {
			res.status(500).json({ message: error.message });
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async updateExample(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { courseId, wordId, exampleId, title, sentence, explanation } = req.body;
			console.log(courseId, wordId, exampleId, title, sentence, explanation);
			const { "user id": userId } = req.user;

			if (!courseId || !wordId || !title || !sentence)
				return res.status(404).json({ messageCode: "MISS_PARAMETER" });

			conn.query("CALL SP_UpdateExample(?,?,?,?,?,?,?)", [
				courseId,
				userId,
				wordId,
				exampleId,
				title,
				sentence,
				explanation,
			])
				.then((response) => {
					res.status(200).json({ updatedExample: response[0][0][0] });
				})
				.catch((error) => {
					if (error.sqlState == 45001) {
						// COURSE_NOT_FOUND: không tìm thấy khoá phù hợp hoặc không sở hữu khoá này
						res.status(404).json({ messageCode: "EXAMPLE_NOT_FOUND" });
					} else {
						res.status(500).json({ message: error.message });
					}
				});
		} catch (error) {
			res.status(500).json({ message: error.message });
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async disableExample(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { "course-id": courseId, "word-id": wordId, "example-id": exampleId } = req.query;

			if (!courseId || !wordId || !exampleId) return res.status(404).json({ messageCode: "MISS_PARAMETER" });

			conn.query("CALL SP_DisableExample(?,?,?,?)", [courseId, userId, wordId, exampleId])
				.then(() => {
					res.status(200).json({ messageCode: "DELETE_EXAMPLE_SUCCESS" });
				})
				.catch((error) => {
					if (error.sqlState == 45001) {
						// COURSE_NOT_FOUND: không tìm thấy khoá phù hợp hoặc không sở hữu khoá này
						res.status(404).json({ messageCode: "EXAMPLE_NOT_FOUND" });
					} else {
						res.status(500).json({ message: error.message });
					}
				});
		} catch (error) {
			res.status(500).json({ message: error.message });
		} finally {
			pool.releaseConnection(conn);
		}
	}
}

module.exports = new ExampleControllerClass();
