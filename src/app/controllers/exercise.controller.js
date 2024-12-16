const { pool } = require("../../db/connectDB.js");
const { uploadImage, uploadAudio } = require("../../utils/uploadToCloud");
const { CommonHelpers } = require("../helpers/commons");
const { validation } = require("../../utils/inputValidations");

class ExerciseController {
	async getExerciseByLevel(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { "course-id": courseId, "level-id": levelId } = req.query;

			if (!courseId) {
				return res.status(401).json({ errorCode: "MISS_PARAMETER" });
			}

			if (levelId) {
				let response = await conn.query("CALL SP_GetExerciseByLevels(?,?,?)", [courseId, userId, levelId]);
				res.status(200).json({ exercises: response[0][0] });
			} else {
				let response = await conn.query("CALL SP_GetExerciseByCourse(?,?)", [courseId, userId]);
				res.status(200).json({ exercises: response[0][0] });
			}
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
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
				exerciseType,
				difficultyLevel = 1,
				questionText,
				answerText,
				image = null,
				audio = null,
				splitChar = "\\n",
				explanation,
				options,
				title,
			} = req.body;

			if (image && !validation.url(image)) {
				image = await uploadImage(image, [title]);
			}
			if (audio && !validation.url(audio)) audio = await uploadAudio(audio, [title]);

			let response = await conn.query("CALL SP_InsertNewExercise(?,?,?,?,?,?,?,?,?,?,?,?,?)", [
				courseId,
				userId,
				levelId,
				title,
				exerciseType,
				difficultyLevel,
				questionText,
				options,
				answerText,
				image,
				audio,
				splitChar,
				explanation,
			]);
			res.status(200).json({ newExercise: response[0][0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async updateExercise(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			let { courseId, levelId, exerciseId, difficultyLevel, questionText, answerText, image, audio, splitChar, explanation, options, title } = req.body;

			console.log({
				explanation,
			});

			if (image && !validation.url(image)) {
				image = await uploadImage(image, [title]);
			}
			if (audio && !validation.url(audio)) audio = await uploadAudio(audio, [title]);

			let response = await conn.query("CALL SP_UpdateExercise(?,?,?,?,?,?,?,?,?,?,?,?,?)", [
				userId,
				courseId,
				levelId,
				exerciseId,
				difficultyLevel,
				questionText,
				answerText,
				image,
				audio,
				splitChar,
				explanation,
				options,
				title,
			]);

			res.status(200).json({ updatedExercise: response[0][0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async disableExercise(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			let { "course-id": courseId, "level-id": levelId, "exercise-id": exerciseId } = req.query;

			await conn.query("CALL SP_DisableExercise(?,?,?,?)", [courseId, userId, levelId, exerciseId]);
			res.status(200).json({ messageCode: "DELETE_EXERCISE_SUCCESS" });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}
}

module.exports = new ExerciseController();
