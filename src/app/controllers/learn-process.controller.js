const { pool } = require("../../connectDB");

class LearnProcessController {
	async getLearnNewWords(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { "ci": courseId } = req.query;
			let returns = [];
			let responseSql = await conn.query("CALL SP_LearnNewWords(?,?)", [courseId, userId]);
			if (responseSql[0][0].length > 0) {
				for (let item of responseSql[0][0]) {
					let [[examples, learnt, notLearn]] = await conn.query("CALL SP_GetRelatedWords(?)", [item?.["word id"]]);

					const combined = learnt.concat(notLearn);
					const wordOptions = [];
					const definitionOptions = [];
					const pronunciationOptions = [];

					combined.forEach(({ word, definition, pronunciation }) => {
						wordOptions.push(word);
						definitionOptions.push(definition);
						pronunciationOptions.push(pronunciation);
					});

					let screens = [
						{
							template: "definition",
							wordId: item?.["word id"],
							word: item?.["word"],
							definition: item?.["definition"],
							pronunciation: item?.["pronunciation"],
							transcript: item?.["transcription"],
							image: item?.["image"],
							type: item?.["type"],
							examples,
						},
						{
							template: "multiple-choice",
							wordId: item?.["word id"],
							question: item?.["word"],
							answer: item?.["definition"],
							options: definitionOptions,
							pronunciation: item?.["pronunciation"],
							image: item?.["image"],
						},
						{
							template: "multiple-choice",
							wordId: item?.["word id"],
							question: item?.["pronunciation"],
							answer: item?.["definition"],
							options: pronunciationOptions,
							image: item?.["image"],
						},
						{
							template: "multiple-choice",
							wordId: item?.["word id"],
							question: item?.["definition"],
							answer: item?.["word"],
							options: wordOptions,
							pronunciation: item?.["pronunciation"],
							image: item?.["image"],
						},
						{
							template: "fill-blank",
							wordId: item?.["word id"],
							question: item?.["definition"],
							answer: item?.["word"],
							pronunciation: item?.["pronunciation"],
							image: item?.["image"],
						},
						{
							template: "fill-blank",
							wordId: item?.["word id"],
							question: item?.["definition"],
							answer: item?.["word"],
							pronunciation: item?.["pronunciation"],
							image: item?.["image"],
						},
					];
					returns.push({
						wordId: item?.["word id"],
						word: item?.["word"],
						definition: item?.["definition"],
						screens,
					});
				}
			}
			res.status(200).json({ returns });
		} catch (error) {
			console.error(error);
			if (error?.sqlState == 45000) {
				res.status(406).json({ errorCode: "NOT_YET_ENROLLMENT" });
			} else {
				res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
			}
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async updateLearnProgress(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId, words = [] } = req.body; // words = [{wordId: number, wrongTimes: number, repeatTimes: number}]

			for (let word of words) {
				await conn.query("CALL SP_UpdateCourseProgress(?,?,?,?,?)", [userId, courseId, word?.wordId, word?.wrongTimes, word?.repeatTimes]);
			}
			res.status(200).json({ messageCode: "UPDATED" });
		} catch (error) {
			if (error?.sqlState == 45000) {
				console.error(error);
				res.status(406).json({ errorCode: "NOT_YET_ENROLLMENT" });
			} else {
				res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
			}
		} finally {
			pool.releaseConnection(conn);
		}
	}
}

module.exports = new LearnProcessController();