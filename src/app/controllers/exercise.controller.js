const { pool } = require("../../connectDB");
const { uploadImage, uploadAudio } = require("../../utils/uploadToCloud");

class ExerciseController {
	async getExerciseByCourse(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { "course-id": courseId } = req.query;


			if (!courseId) {
				return res.status(401).json({ messageCode: "MISS_PARAMETER" });
			}

			conn.query("CALL SP_GetExerciseByCourse(?,?)", [courseId, userId])
				.then(response => {
					res.status(200).json({ exercises: response[0][0] });
				})
				.catch(error => {
					if (error.sqlState == 45000) {
						res.status(404).json({ messageCode: "COURSE_NOT_FOUND" });
					} else {
						res.status(500).json({ error: error.message });
					}
				});
		} catch (error) {
			res.status(500).json({ error: error.message });
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async getExerciseByLevel(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { "course-id": courseId, "level-id": levelId } = req.query;


			if (!courseId || !levelId) {
				return res.status(401).json({ messageCode: "MISS_PARAMETER" });
			}

			conn.query("CALL SP_GetExerciseByLevels(?,?,?)", [courseId, userId, levelId])
				.then(response => {
					res.status(200).json({ exercises: response[0][0] });
				})
				.catch(error => {
					if (error.sqlState == 45000) {
						res.status(404).json({ messageCode: "COURSE_NOT_FOUND" });
					} else {
						res.status(500).json({ error: error.message });
					}
				});
		} catch (error) {
			res.status(500).json({ error: error.message });
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async addNewExercise(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			let {
				courseId,
				levelId,
				exerciseTypeId,
				difficultyLevel = 1,
				questionText,
				answerText,
				image = null,
				audio = null,
				splitChar = "\\n",
			} = req.body;

			if (image) {
				image = await uploadImage(image, []);
			}

			if (audio)
				image = await uploadAudio(audio, []);

			conn.query("CALL SP_InsertNewExample(?,?,?,?,?,?,?,?,?,?)", [courseId, userId, levelId, exerciseTypeId, difficultyLevel, questionText, answerText, image, audio, splitChar])
				.then(response => {
					res.status(200).json({ newExercise: response[0][0][0] });
				})
				.catch(error => {
					if (error.sqlState == 45000) {
						res.status(404).json({ messageCode: "COURSE_NOT_FOUND" });
					} else if (error.sqlState == 45001) {
						res.status(404).json({ messageCode: "EXERCISE_TYPE_NOT_FOUND" });
					} else {
						res.status(500).json({ error: error.message });
					}
				});
		} catch (error) {
			res.status(500).json({ error: error.message });
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async updateExercise(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			let {
				courseId,
				levelId,
				exerciseId,
				exerciseTypeId,
				difficultyLevel = 1,
				questionText,
				answerText,
				image = null,
				audio = null,
				splitChar = "\\n",
			} = req.body;

			if (image) {
				image = await uploadImage(image, []);
			}
			if (audio)
				image = await uploadAudio(audio, []);

			conn.query("CALL SP_UpdateExercise(?,?,?,?,?,?,?,?,?,?,?)", [courseId, userId, levelId, exerciseId, exerciseTypeId, difficultyLevel, questionText, answerText, image, audio, splitChar])
				.then(response => {
					res.status(200).json({ updatedExercise: response[0][0][0] });
				})
				.catch(error => {
					if (error.sqlState == 45000) {
						res.status(404).json({ messageCode: "COURSE_NOT_FOUND" });
					} else if (error.sqlState == 45001) {
						res.status(404).json({ messageCode: "EXERCISE_TYPE_NOT_FOUND" });
					} else {
						res.status(500).json({ error: error.message });
					}
				});
		} catch (error) {
			res.status(500).json({ error: error.message });
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async disableExercise(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			let {
				"course-id": courseId,
				"level-id": levelId,
				"exercise-id": exerciseId,
			} = req.query;
			
			conn.query("CALL SP_DisableExercise(?,?,?,?)", [courseId, userId, levelId, exerciseId])
				.then(() => {
					res.status(200).json({ messageCode: "DELETE_EXERCISE_SUCCESS" });
				})
				.catch(error => {
					if (error.sqlState == 45000) {
						res.status(404).json({ messageCode: "COURSE_NOT_FOUND" });
					} else if (error.sqlState == 45001) {
						res.status(404).json({ messageCode: "EXERCISE_TYPE_NOT_FOUND" });
					} else {
						res.status(500).json({ error: error.message });
					}
				});
		} catch (error) {
			res.status(500).json({ error: error.message });
		} finally {
			pool.releaseConnection(conn);
		}
	}
}

module.exports = new ExerciseController();