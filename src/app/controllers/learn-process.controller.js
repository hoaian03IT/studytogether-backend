const { pool } = require("../../connectDB");

class LearnProcessController {
	async getLearnNewWords(req, res) {
		let conn;
		try {
			const POINT_PER_QUES = 100;
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { ci: courseId } = req.query;
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

					let screens = [];
					// add definition screen
					screens.push({
						template: "definition",
						wordId: item?.["word id"],
						word: item?.["word"],
						definition: item?.["definition"],
						pronunciation: item?.["pronunciation"],
						transcript: item?.["transcription"],
						image: item?.["image"],
						type: item?.["type"],
						examples,
					});
					// add multiple choice screen
					screens.push({
						template: "multiple-choice",
						wordId: item?.["word id"],
						question: item?.["word"],
						answer: item?.["definition"],
						options: definitionOptions,
						// pronunciation: item?.["pronunciation"],
						image: item?.["image"],
					});
					screens.push({
						template: "multiple-choice",
						wordId: item?.["word id"],
						question: item?.["definition"],
						answer: item?.["word"],
						options: wordOptions,
						pronunciation: "",
						image: item?.["image"],
					});
					if (item?.["pronunciation"]) screens.push({
						template: "multiple-choice",
						wordId: item?.["word id"],
						question: "",
						answer: item?.["word"],
						options: wordOptions,
						pronunciation: item?.["pronunciation"],
						image: item?.["image"],
					});

					// add text-input screen
					screens.push({
						template: "text",
						wordId: item?.["word id"],
						question: item?.["definition"],
						answer: item?.["word"],
						// pronunciation: item?.["pronunciation"],
						image: item?.["image"],
					});

					if (item?.["pronunciation"])
						screens.push({
							template: "text",
							wordId: item?.["word id"],
							question: "",
							answer: item?.["word"],
							pronunciation: item?.["pronunciation"],
							image: item?.["image"],
						});

					returns.push({
						wordId: item?.["word id"],
						word: item?.["word"],
						definition: item?.["definition"],
						screens,
					});
				}
			}
			res.status(200).json({ returns, unitPoint: POINT_PER_QUES });
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

	async createLearnProgress(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId, words = [], points = 0 } = req.body; // words = [{wordId: number, wrongTimes: number, repeatable: boolean}]

			let remainingAppearances = 0;
			for (let word of words) {
				if (word?.wrongTimes > 0) {
					remainingAppearances = 5;
				}

				await conn.query("CALL SP_CreateCourseProgress(?,?,?,?,?,?)", [userId, courseId, word?.wordId, !!word?.repeatable, word?.wrongTimes, remainingAppearances]);
			}

			// cap nhat diem
			await conn.query("CALL SP_UpdateUserPoint(?,?,?)", [userId, courseId, points]);

			res.status(200).json({ messageCode: "UPDATED" });
		} catch (error) {
			console.error(error);
			if (error?.sqlState >= 45000) {
				res.status(406).json({ errorCode: error?.sqlMessage });
			} else {
				res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
			}
		} finally {
			pool.releaseConnection(conn);
		}
	}
}

module.exports = new LearnProcessController();
