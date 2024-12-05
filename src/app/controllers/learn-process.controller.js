const { pool } = require("../../connectDB");
const { CommonHelpers } = require("../helpers/commons");
const { LearnProcessHelper } = require("../helpers/learn-process.helper");


class LearnProcessController {
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
				const screens = LearnProcessHelper.generateScreens(item, examples, learnt, notLearn, true);
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
				template: "LEARN_NEW_WORD",
			});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async createLearnProgress(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId, words = [], points = 0 } = req.body;

			for (const { wordId, wrongTimes, repeatable } of words) {
				const remainingAppearances = wrongTimes > 0 ? 2 : 0;

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
			// cap nhat streak
			const currentDay = new Date().toISOString().split("T")[0];
			await conn.query("CALL SP_UpdateStreak(?,?)", [userId, currentDay]);

			res.status(200).json({ messageCode: "UPDATE_SUCCESS" });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
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
				const screens = LearnProcessHelper.generateScreens(item, examples, learnt, notLearn, false, true);

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
				messageCode: "SPEED_REVIEW",
			});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	};

	async updateLearnProgress(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId, words = [], points = 0 } = req.body; // words item: {wordId: number, wrongTimes: number, repeatable: boolean}


			await Promise.all(words.map(async (word) => {
				let remainingAppearances = word?.wrongTimes < 0 ? 0 : word?.wrongTimes === 0 ? -1 : 0; //
				// wrongTimes = -1 (không cập nhật wrongTimes & appearances, chỉ cập nhật repeatable)
				// wrongTimes = 0 (cập nhật giảm 1 lần remaining appearances trong lần review tới)
				// wrongTimes > 1 (cập nhật tăng thêm 1 lần remaining appearances trong lần review tới)
				await conn.query("CALL SP_UpdateCourseProgress(?,?,?,?,?,?)", [userId, courseId, word?.wordId, word?.wrongTimes, word?.repeatable, remainingAppearances]);
			}));

			await conn.query("CALL SP_UpdateUserPoint(?,?,?)", [userId, courseId, points]);
			const currentDay = new Date().toISOString().split("T")[0];
			await conn.query("CALL SP_UpdateStreak(?,?)", [userId, currentDay]);

			res.status(200).json({ messageCode: "UPDATE_SUCCESS" });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}
}

module.exports = new LearnProcessController();
