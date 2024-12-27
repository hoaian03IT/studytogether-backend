const { CommonHelpers } = require("../helpers/commons/index");
const { pool } = require("../../db/connectDB");

class CommentController {
	async createFeedbackComment(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId, comment, rate } = req.body;

			let response = await conn.query("CALL SP_CreateFeedbackComment(?,?,?,?)", [courseId, userId, rate, comment]);

			res.status(200).json({
				messageCode: "FEEDBACK_SUCCESS",
				commentId: response[0][0][0]?.["comment id"],
				comment: response[0][0][0]?.["comment"],
				firstName: response[0][0][0]?.["first name"],
				lastName: response[0][0][0]?.["last name"],
				username: response[0][0][0]?.["username"],
				avatarImage: response[0][0][0]?.["avatar image"],
				createdAt: response[0][0][0]?.["created at"],
				rate: response[0][0][0]?.["rate"],
				role: response[0][0][0]?.["role name"],
				replies: [],
			});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async createReplyComment(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId, comment, replyCommentId } = req.body;

			let response = await conn.query("CALL SP_CreateReplyComment(?,?,?,?)", [courseId, userId, comment, replyCommentId]);
			res.status(200).json({
				messageCode: "COMMENT_SUCCESS",
				commentId: response[0][0][0]?.["comment id"],
				comment: response[0][0][0]?.["comment"],
				firstName: response[0][0][0]?.["first name"],
				lastName: response[0][0][0]?.["last name"],
				username: response[0][0][0]?.["username"],
				avatarImage: response[0][0][0]?.["avatar image"],
				createdAt: response[0][0][0]?.["created at"],
				replyCommentId: response[0][0][0]?.["reply comment id"],
				rate: response[0][0][0]?.["rate"],
				role: response[0][0][0]?.["role name"],
			});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async getCourseRates(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { courseId } = req.params;

			let response = await conn.query("CALL SP_GetCourseRate(?)", [courseId]);

			const courseRates = {
				1: 0,
				2: 0,
				3: 0,
				4: 0,
				5: 0,
			};

			for (let rate of response[0][1]) {
				courseRates[Math.floor(rate?.rate)]++;
			}

			res.status(200).json({
				averageRate: response[0][0][0]?.["avg rate"],
				numberRates: response[0][0][0]?.["number rates"],
				rates: courseRates,
				numberComments: response[0][2][0]?.["total comments"],
			});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}
}

module.exports = new CommentController();
