const { validation } = require("../../utils/inputValidations");
const { pool } = require("../../db/connectDB.js");
const { uploadImage } = require("../../utils/uploadToCloud");
const { CommonHelpers } = require("../helpers/commons");
const cloudinary = require("cloudinary").v2;

class Course {
	async getCourseInformation(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "course-id": courseId } = req.query;
			let response = await conn.query("CALL SP_GetCourseInformation(?)", [courseId]);
			res.status(200).json(response[0][0][0]);
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async getCourseContent(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "course-id": courseId } = req.query;
			let response = await conn.query("CALL SP_GetCourseContent(?)", [courseId]);
			let content = { courseId, levels: [] };
			let array = response[0][0];
			let levels = [];

			let currentLevelId = array[0]["level id"];
			let count = 0;
			// chuyen cac record thanh dang array: {levelId: X, words: [{'word id': X, word: X, type: X, definition: X}]}
			levels.push({
				levelId: currentLevelId,
				levelName: array[0]["level name"],
				words: [],
			});
			for (let item of array) {
				if (item["level id"] !== currentLevelId) {
					currentLevelId = item["level id"];
					count++;
					levels.push({
						levelId: item["level id"],
						levelName: item["level name"],
						words: [],
					});
				}
				levels[count].words.push({
					"word id": item["word id"],
					word: item["word"],
					type: item["type"],
					definition: item["definition"],
				});
			}

			content.levels = levels;
			res.status(200).json(content);
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async getCourseComment(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "course-id": courseId } = req.query;
			conn.query("CALL SP_GetCourseComment(?)", [courseId])
				.then((response) => {
					let comments = {};
					let array = response[0][0];
					// chia cac comment thanh 2 loai: feedback va replies
					for (let item of array) {
						if (item["reply comment id"] === null) {
							comments[item["comment id"]] = {
								commentId: item["comment id"],
								comment: item["comment"],
								firstName: item["first name"],
								lastName: item["last name"],
								username: item["username"],
								avatarImage: item["avatar image"],
								createdAt: item["created at"],
								rate: item["rate"],
								role: item["role name"],
								replies: [],
							};
						} else {
							comments[item["reply comment id"]].replies.push({
								commentId: item["comment id"],
								comment: item["comment"],
								firstName: item["first name"],
								lastName: item["last name"],
								username: item["username"],
								avatarImage: item["avatar image"],
								createdAt: item["created at"],
								rate: item["rate"],
								role: item["role name"],
							});
						}
					}
					res.status(200).json(comments);
				})
				.catch((error) => {
					if (error.sqlState == 45000) {
						res.status(404).json({ errorCode: "COURSE_NOT_FOUND" });
					} else {
						res.status(500).json({ message: error.message });
					}
				});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async getCourseLanguages(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "course-id": courseId } = req.query;
			const response = await conn.query("CALL SP_GetCourseLanguages(?)", [courseId]);
			res.status(200).json({ ...response[0][0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async createCourseInformation(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;

			let { courseName, sourceLanguageId, courseLevelId, tag = "", shortDescription = "", detailedDescription = "", image } = req.body;

			if (image) {
				const upload = await cloudinary.uploader.upload(image, {
					asset_folder: "/course-images",
					tags: [tag],
					quality: 50,
				});
				image = upload.url;
			}

			const defaultImagePath = `${process.env.SERVER_URL}/static/default-course-thumbnail.png`;

			if (!image) image = defaultImagePath;

			let sqlResponse1 = await conn.query("CALL SP_CreateCourse(?,?,?,?,?,?,?,?)", [
				userId,
				courseName,
				sourceLanguageId,
				courseLevelId,
				tag,
				shortDescription,
				detailedDescription,
				image,
			]);

			await conn.query("CALL SP_UpdatePrice(?,?,?,?,?,?,?)", [userId, sqlResponse1[0][0][0]?.[`course id`], 0, 0, "USD", null, null]);

			res.status(200).json({ messageCode: "CREATE_COURSE_SUCCESS", courseId: sqlResponse1[0][0][0]?.[`course id`] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async updateCourseInformation(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			let { courseId, courseName, sourceLanguageId, courseLevelId, tag, shortDescription, detailedDescription, image, isPrivate = false } = req.body;

			if (!courseId || !userId) {
				res.status(401).json({ errorCode: "MISS_PARAMETER" });
			}

			if (image && !validation.url(image)) {
				image = await uploadImage(image, [tag]);
			} else if (!image) {
				image = `${process.env.SERVER_URL}/static/default-course-thumbnail.png`;
			}

			let response = await conn.query("CALL SP_UpdateCourseInformation(?,?,?,?,?,?,?,?,?,?)", [
				userId,
				courseId,
				courseName,
				sourceLanguageId,
				courseLevelId,
				tag,
				shortDescription,
				detailedDescription,
				image,
				Boolean(isPrivate),
			]);
			res.status(200).json({ updatedCourse: response[0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async destroyOwnCourse(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId } = req.params;

			await conn.query("CALL SP_DestroyOwnCourse(?, ?)", [courseId, userId]);

			res.status(200).json({
				messageCode: "DELETE_COURSE_SUCCESS",
			});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async getCoursePrice(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "course-id": courseId } = req.query;

			const responseSQl = await conn.query("CALL SP_GetCoursePrice(?)", [courseId]);
			res.status(200).json({ ...responseSQl[0][0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async updateCoursePrice(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId, newPrice, newDiscount, discountFrom = null, discountTo = null, currency = "USD" } = req.body;

			if (!courseId) {
				res.status(404).json({ errorCode: "COURSE_NOT_FOUND" });
			}

			let responseSql = await conn.query("CALL SP_UpdatePrice(?,?,?,?,?,?,?)", [
				userId,
				courseId,
				newPrice,
				newDiscount,
				currency,
				discountFrom,
				discountTo,
			]);
			res.status(200).json({
				updatedPrice: responseSql[0][0],
				messageCode: "UPDATE_SUCCESS",
			});
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async getOwnCourses(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;

			let responseSql = await conn.query("CALL SP_GetOwnCourse(?)", [userId]);

			res.status(200).json({ courses: responseSql[0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async getEnrolledCourse(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;

			let incompleteCourses = [],
				completeCourses = [];

			let responseSql1 = await conn.query("CALL SP_GetEnrolledCourse(?)", [userId]);

			for (let record of responseSql1[0][0]) {
				let responseSq2 = await conn.query("CALL SP_GetProgressEnrollment(?)", [record?.["enrollment id"]]);
				let { "total words": totalWords, "learnt words": learntWords } = responseSq2[0][0][0];
				if (totalWords === learntWords) {
					completeCourses.push({
						...record,
						learntWords,
						totalWords,
					});
				} else {
					incompleteCourses.push({
						...record,
						learntWords,
						totalWords,
					});
				}
			}

			res.status(200).json({ incompleteCourses, completeCourses });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async searchCourse(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			let {
				ts: textSearch = "",
				t: type = "normal",
				tli: targetLanguageId = null,
				sli: sourceLanguageId = null,
				cli: courseLevelId = null,
				mip: minPrice = 0,
				map: maxPrice = 99999,
				nlm: nLimit = 15,
				np: nPage = 1,
			} = req.query; // type=normal || advance
			let responseSql;
			if (type === "advance") {
				responseSql = await conn.query("CALL SP_SearchCourseAdvance(?,?,?,?,?,?,?,?)", [
					textSearch,
					targetLanguageId,
					sourceLanguageId,
					courseLevelId,
					minPrice,
					maxPrice,
					nLimit,
					nPage,
				]);
			} else {
				responseSql = await conn.query("CALL SP_SearchNameCourse(?,?,?)", [textSearch, nLimit, nPage]);
			}

			res.status(200).json({ courses: responseSql[0][0], totalPages: responseSql[0][1][0]?.["total pages"], type });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}
}

module.exports = new Course();
