const { pool } = require("../../connectDB");
const { v2: cloudinary } = require("cloudinary");
const { uploadImage, uploadAudio } = require("../../utils/uploadToCloud");

const uploadImageToCloudinary = () => {
};

class VocabularyControllerClass {
	async getAllVocabulary(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId } = req.params;
			if (!courseId) return res.status(404).json({ errorCode: "COURSE_NOT_FOUND" });
			conn.query("CALL SP_GetAllWords(?, ?)", [courseId, userId])
				.then(response => {
					res.status(200).json({ vocabularyList: response[0][0] });
				}).catch(error => {
				if (error.sqlState == 45000) {
					res.status(404).json({ errorCode: "COURSE_NOT_FOUND" });
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

	async addNewWord(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			let { courseId, levelId, word, definition, image, pronunciation, type } = req.body;
			if (!courseId) return res.status(404).json({ message: "Not found" });
			if (image) {
				image = await uploadImage(image, [word]);
			}

			if (pronunciation) {
				pronunciation = await uploadAudio(pronunciation, [word]);
			}


			conn.query("CALL SP_InsertNewWord(?,?,?,?,?,?,?,?)", [
				courseId,
				userId,
				word,
				definition,
				image,
				pronunciation,
				levelId,
				type,
			])
				.then((response) => {
					res.status(200).json({ newWord: response[0][0][0] });
				})
				.catch((err) => {
					res.status(400).json({ message: err.message });
				});
		} catch (error) {
			res.status(500).json({ message: error.message });
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async updateWord(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			let { courseId, levelId, wordId, word, definition, image, pronunciation, type } = req.body;
			if (!courseId || !levelId || !wordId) return res.status(404).json({ message: "Not found" });


			if (image) {
				image = await uploadImage(image, [word]);
			}

			if (pronunciation) {
				pronunciation = await uploadAudio(pronunciation, [word]);
			}

			console.log(courseId, levelId, wordId, word, definition, image, pronunciation, type);

			conn.query("CALL SP_UpdateWord(?,?,?,?,?,?,?,?,?)", [
				courseId,
				userId,
				levelId,
				wordId,
				word,
				type,
				definition,
				image,
				pronunciation,
			])
				.then((response) => {
					res.status(200).json({ updatedWord: response[0][0][0] });
				})
				.catch((err) => {
					res.status(400).json({ message: err.message });
				});
		} catch (error) {
			res.status(500).json({ message: error.message });
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async deleteWord(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { "course-id": courseId, "level-id": levelId, "word-id": wordId } = req.query;
			if (!courseId || !levelId || !wordId) return res.status(404).json({ message: "Not found" });

			conn.query("CALL SP_DeleteWord(?,?,?,?)", [courseId, userId, levelId, wordId])
				.then(() => {
					res.status(200).json({ messageCode: "DELETE_SUCCESS" });
				})
				.catch((err) => {
					res.status(400).json({ message: err.message });
				});
		} catch (error) {
			res.status(500).json({ message: error.message });
		} finally {
			pool.releaseConnection(conn);
		}
	}
}

const VocabularyController = new VocabularyControllerClass();

module.exports = VocabularyController;
