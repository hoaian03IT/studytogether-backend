const { pool } = require("../../db/connectDB.js");
const { uploadImage, uploadAudio } = require("../../utils/uploadToCloud");
const { validation } = require("../../utils/inputValidations");
const { CommonHelpers } = require("../helpers/commons");

class VocabularyControllerClass {
	async getAllVocabulary(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId } = req.params;
			if (!courseId) return res.status(404).json({ errorCode: "COURSE_NOT_FOUND" });
			let response = await conn.query("CALL SP_GetAllWords(?, ?)", [courseId, userId]);
			res.status(200).json({
				vocabularyList: [...response[0][1].slice(1)],
				targetLanguage: response[0][0][0]?.["target language"],
				sourceLanguage: response[0][0][0]?.["source language"],
				courseId: response[0][0][0]?.["course id"],
			});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async addNewWord(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			let { courseId, levelId, word, definition, image, pronunciation, type, transcription } = req.body;
			if (!courseId) return res.status(404).json({ messageCode: "NOT_FOUND" });
			if (image) {
				image = await uploadImage(image, [word]);
			}

			if (pronunciation && validation.url(pronunciation)) {
				pronunciation = await uploadAudio(pronunciation, [word]);
			}

			let response = await conn.query("CALL SP_InsertNewWord(?,?,?,?,?,?,?,?,?)", [
				courseId,
				userId,
				word,
				definition,
				image,
				pronunciation,
				levelId,
				type,
				transcription,
			]);
			res.status(200).json({ newWord: response[0][0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async updateWord(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			let { courseId, levelId, wordId, word, definition, image, pronunciation, type, transcription } = req.body;
			if (!courseId || !levelId || !wordId) return res.status(404).json({ messageCode: "MISS_PARAMETER" });

			if (image && !validation.url(image)) {
				image = await uploadImage(image, [word]);
			}

			if (pronunciation && !validation.url(pronunciation)) {
				pronunciation = await uploadAudio(pronunciation, [word]);
			}

			let response = await conn.query("CALL SP_UpdateWord(?,?,?,?,?,?,?,?,?, ?)", [
				courseId,
				userId,
				levelId,
				wordId,
				word,
				type,
				definition,
				image,
				pronunciation,
				transcription,
			]);
			res.status(200).json({ updatedWord: response[0][0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async deleteWord(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { "course-id": courseId, "level-id": levelId, "word-id": wordId } = req.query;
			if (!courseId || !levelId || !wordId) return res.status(404).json({ messageCode: "MISS_PARAMETER" });

			await conn.query("CALL SP_DeleteWord(?,?,?,?)", [courseId, userId, levelId, wordId]);
			res.status(200).json({ messageCode: "DELETE_SUCCESS" });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}
}

const VocabularyController = new VocabularyControllerClass();

module.exports = VocabularyController;
