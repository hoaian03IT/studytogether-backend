// const { pool } = require("../../connectDB");
//
// class LearnProcessController {
// 	async getLearnNewWords(req, res) {
// 		let conn;
// 		try {
// 			const POINT_PER_QUES = 100;
// 			conn = await pool.getConnection();
// 			const { "user id": userId } = req.user;
// 			const { ci: courseId } = req.query;
//
// 			let returns = [];
// 			let levelNames = [];
// 			let responseSql = await conn.query("CALL SP_LearnNewWords(?,?)", [courseId, userId]);
// 			if (responseSql[0][0].length > 0) {
// 				for (let item of responseSql[0][0]) {
// 					if (!levelNames.includes(item?.["level name"]))
// 						levelNames.push(item?.["level name"]);
//
// 					let [[examples, learnt, notLearn]] = await conn.query("CALL SP_GetRelatedWords(?)", [item?.["word id"]]);
//
// 					const combined = learnt.concat(notLearn);
// 					const wordOptions = [];
// 					const definitionOptions = [];
// 					const pronunciationOptions = [];
//
// 					combined.forEach(({ word, definition, pronunciation }) => {
// 						wordOptions.push(word);
// 						definitionOptions.push(definition);
// 						pronunciationOptions.push(pronunciation);
// 					});
//
// 					let screens = [];
// 					// add definition screen
// 					screens.push({
// 						template: "definition",
// 						wordId: item?.["word id"],
// 						word: item?.["word"],
// 						definition: item?.["definition"],
// 						pronunciation: item?.["pronunciation"],
// 						transcript: item?.["transcription"],
// 						image: item?.["image"],
// 						type: item?.["type"],
// 						examples,
// 					});
// 					// add multiple choice screen
// 					screens.push({
// 						template: "multiple-choice",
// 						wordId: item?.["word id"],
// 						question: item?.["word"],
// 						answer: item?.["definition"],
// 						options: definitionOptions,
// 						// pronunciation: item?.["pronunciation"],
// 						image: item?.["image"],
// 					});
// 					screens.push({
// 						template: "multiple-choice",
// 						wordId: item?.["word id"],
// 						question: item?.["definition"],
// 						answer: item?.["word"],
// 						options: wordOptions,
// 						pronunciation: "",
// 						image: item?.["image"],
// 					});
// 					if (item?.["pronunciation"]) screens.push({
// 						template: "multiple-choice",
// 						wordId: item?.["word id"],
// 						question: "",
// 						answer: item?.["word"],
// 						options: wordOptions,
// 						pronunciation: item?.["pronunciation"],
// 						image: item?.["image"],
// 					});
//
// 					// add text-input screen
// 					screens.push({
// 						template: "text",
// 						wordId: item?.["word id"],
// 						question: item?.["definition"],
// 						answer: item?.["word"],
// 						// pronunciation: item?.["pronunciation"],
// 						image: item?.["image"],
// 					});
//
// 					if (item?.["pronunciation"])
// 						screens.push({
// 							template: "text",
// 							wordId: item?.["word id"],
// 							question: "",
// 							answer: item?.["word"],
// 							pronunciation: item?.["pronunciation"],
// 							image: item?.["image"],
// 						});
//
// 					returns.push({
// 						wordId: item?.["word id"],
// 						word: item?.["word"],
// 						definition: item?.["definition"],
// 						pronunciation: item?.["pronunciation"],
// 						image: item?.["image"],
// 						transcription: item?.["transcription"],
// 						screens,
// 					});
// 				}
// 			}
// 			res.status(200).json({ returns, unitPoint: POINT_PER_QUES, levelNames, template: "learn-new-word" });
// 		} catch (error) {
// 			console.error(error);
// 			if (error?.sqlState == 45000) {
// 				res.status(406).json({ errorCode: "NOT_YET_ENROLLMENT" });
// 			} else {
// 				res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
// 			}
// 		} finally {
// 			pool.releaseConnection(conn);
// 		}
// 	}
//
// 	async createLearnProgress(req, res) {
// 		let conn;
// 		try {
// 			conn = await pool.getConnection();
// 			const { "user id": userId } = req.user;
// 			const { courseId, words = [], points = 0 } = req.body; // words = [{wordId: number, wrongTimes: number, repeatable: boolean}]
//
// 			for (let word of words) {
// 				let remainingAppearances = 0;
// 				if (word?.wrongTimes > 0) {
// 					remainingAppearances = 5;
// 				}
//
// 				await conn.query("CALL SP_CreateCourseProgress(?,?,?,?,?,?)", [userId, courseId, word?.wordId, !!word?.repeatable, word?.wrongTimes, remainingAppearances]);
// 			}
//
// 			// cap nhat diem
// 			await conn.query("CALL SP_UpdateUserPoint(?,?,?)", [userId, courseId, points]);
//
// 			res.status(200).json({ messageCode: "UPDATED" });
// 		} catch (error) {
// 			console.error(error);
// 			if (error?.sqlState >= 45000) {
// 				res.status(406).json({ errorCode: error?.sqlMessage });
// 			} else {
// 				res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
// 			}
// 		} finally {
// 			pool.releaseConnection(conn);
// 		}
// 	}
//
// 	speedReview = async (req, res) => {
// 		let conn;
// 		try {
// 			conn = await pool.getConnection();
// 			const { "user id": userId } = req.user;
// 			const { ci: courseId } = req.query;
//
// 			let responseSql = await conn.query("CALL SP_SelectWordSpeedReview(?,?)", [courseId, userId]);
//
// 			// xử lý nếu chưa học từ nào
// 			if (responseSql[0][0]?.length === 0) {
// 				return await this.getLearnNewWords(req, res);
// 			}
//
// 			let returns = [];
//
// 			for (let item of responseSql[0][0]) {
// 				let screens = [];
// 				let [[examples, learnt, notLearn]] = await conn.query("CALL SP_GetRelatedWords(?)", [item?.["word id"]]);
//
// 				const combined = learnt.concat(notLearn);
// 				const wordOptions = [];
// 				const definitionOptions = [];
//
// 				combined.forEach(({ word, definition }) => {
// 					wordOptions.push(word);
// 					definitionOptions.push(definition);
// 				});
//
// 				screens.push({
// 					template: "multiple-choice",
// 					wordId: item?.["word id"],
// 					question: item?.["word"],
// 					answer: item?.["definition"],
// 					options: definitionOptions,
// 					pronunciation: item?.["pronunciation"],
// 					image: item?.["image"],
// 					timeLimit: 10,
// 				});
//
// 				screens.push({
// 					template: "multiple-choice",
// 					wordId: item?.["word id"],
// 					question: item?.["definition"],
// 					answer: item?.["word"],
// 					options: wordOptions,
// 					pronunciation: item?.["pronunciation"],
// 					image: item?.["image"],
// 					timeLimit: 10,
// 				});
//
// 				screens.push({
// 					template: "text",
// 					wordId: item?.["word id"],
// 					question: item?.["definition"],
// 					answer: item?.["word"],
// 					pronunciation: item?.["pronunciation"],
// 					image: item?.["image"],
// 					timeLimit: 15,
// 				});
//
// 				returns.push({
// 					wordId: item?.["word id"],
// 					word: item?.["word"],
// 					definition: item?.["definition"],
// 					pronunciation: item?.["pronunciation"],
// 					image: item?.["image"],
// 					transcription: item?.["transcription"],
// 					screens,
// 				});
// 			}
//
// 			res.status(200).json({ returns, pointEachScreen: 20, template: "speed-review" });
// 		} catch (error) {
// 			console.error(error);
// 			if (error?.sqlState >= 45000) {
// 				res.status(406).json({ errorCode: error?.sqlMessage });
// 			} else {
// 				res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
// 			}
// 		} finally {
// 			pool.releaseConnection(conn);
// 		}
// 	};
//
// 	async updateLearnProgress(req, res) {
// 		let conn;
// 		try {
//
// 		} finally {
// 			pool.releaseConnection(conn);
// 		}
// 	}
// }
//
// module.exports = new LearnProcessController();


const { pool } = require("../../connectDB");

class LearnProcessController {
	/**
	 * Helper function to release connection safely
	 */
	static async safeRelease(conn) {
		if (conn) await pool.releaseConnection(conn);
	}

	/**
	 * Helper function to handle errors
	 */
	static handleError(error, res) {
		console.error(error);
		if (error?.sqlState >= 45000) {
			res.status(406).json({ errorCode: error?.sqlMessage });
		} else {
			res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
		}
	}

	/**
	 * Helper function to generate screens for a word
	 */
	static generateScreens(word, examples, learnt, notLearn, optionalScreen = false, timer = false) {
		const combined = learnt.concat(notLearn);
		const wordOptions = combined.map(({ word }) => word);
		const definitionOptions = combined.map(({ definition }) => definition);

		const screens = [
			{
				template: "multiple-choice",
				wordId: word?.["word id"],
				question: word.word,
				answer: word.definition,
				options: definitionOptions,
				image: word.image,
				duration: timer ? 2 : null,
			},
			{
				template: "multiple-choice",
				wordId: word?.["word id"],
				question: word.definition,
				answer: word.word,
				options: wordOptions,
				image: word.image,
				duration: timer ? 2 : null,
			},
			{
				template: "text",
				wordId: word?.["word id"],
				question: word.definition,
				answer: word.word,
				image: word.image,
				duration: timer ? 3 : null,
			},
		];

		// Optional screens
		if (optionalScreen && word.pronunciation) {
			screens.push(
				{
					template: "multiple-choice",
					wordId: word?.["word id"],
					question: "",
					answer: word.word,
					options: wordOptions,
					pronunciation: word.pronunciation,
					image: word.image,
					duration: timer ? 2 : null,
				},
				{
					template: "text",
					wordId: word?.["word id"],
					question: "",
					answer: word.word,
					pronunciation: word.pronunciation,
					image: word.image,
					duration: timer ? 15 : null,
				},
				{
					template: "definition",
					wordId: word?.["word id"],
					word: word.word,
					definition: word.definition,
					pronunciation: word.pronunciation,
					transcript: word.transcription,
					image: word.image,
					type: word.type,
					examples,
				},
			);
		}

		return screens;
	}

	async getLearnNewWords(req, res) {
		let conn;
		try {
			const POINT_PER_QUES = 100;
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { ci: courseId } = req.query;

			const levelNames = [];
			const responseSql = await conn.query("CALL SP_LearnNewWords(?,?)", [courseId, userId]);

			let returns = responseSql[0][0]?.map(async item => {
				if (!levelNames.includes(item["level name"])) {
					levelNames.push(item["level name"]);
				}
				const [[examples, learnt, notLearn]] = await conn.query("CALL SP_GetRelatedWords(?)", [item["word id"]]);
				const screens = LearnProcessController.generateScreens(item, examples, learnt, notLearn, true);
				return {
					wordId: item["word id"],
					word: item["word"],
					definition: item["definition"],
					pronunciation: item["pronunciation"],
					image: item["image"],
					transcription: item["transcription"],
					screens,
				};
			});


			res.status(200).json({
				returns: await Promise.all(returns),
				unitPoint: POINT_PER_QUES,
				levelNames,
				template: "learn-new-word",
			});
		} catch (error) {
			LearnProcessController.handleError(error, res);
		} finally {
			LearnProcessController.safeRelease(conn);
		}
	}

	async createLearnProgress(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId, words = [], points = 0 } = req.body;

			for (const { wordId, wrongTimes, repeatable } of words) {
				const remainingAppearances = wrongTimes > 0 ? 5 : 0;

				await conn.query("CALL SP_CreateCourseProgress(?,?,?,?,?,?)", [
					userId,
					courseId,
					wordId,
					!!repeatable,
					wrongTimes,
					remainingAppearances,
				]);
			}

			await conn.query("CALL SP_UpdateUserPoint(?,?,?)", [userId, courseId, points]);
			res.status(200).json({ messageCode: "UPDATED" });
		} catch (error) {
			LearnProcessController.handleError(error, res);
		} finally {
			LearnProcessController.safeRelease(conn);
		}
	}

	speedReview = async (req, res) => {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { ci: courseId } = req.query;

			const responseSql = await conn.query("CALL SP_SelectWordSpeedReview(?,?)", [courseId, userId]);

			const returns = responseSql[0][0].map(async (item) => {
				const [[examples, learnt, notLearn]] = await conn.query("CALL SP_GetRelatedWords(?)", [item["word id"]]);
				const screens = LearnProcessController.generateScreens(item, examples, learnt, notLearn, false, true);

				return {
					wordId: item["word id"],
					word: item["word"],
					definition: item["definition"],
					pronunciation: item["pronunciation"],
					image: item["image"],
					transcription: item["transcription"],
					screens,
				};
			});

			res.status(200).json({
				returns: await Promise.all(returns),
				pointEachScreen: 20,
				template: "speed-review",
			});
		} catch (error) {
			LearnProcessController.handleError(error, res);
		} finally {
			LearnProcessController.safeRelease(conn);
		}
	};
}

module.exports = new LearnProcessController();
