const { validation } = require("../../utils/inputValidations");
const { pool } = require("../../db/connectDB.js");
const { uploadImage } = require("../../utils/uploadToCloud");
const { CommonHelpers } = require("../helpers/commons");
const { transporter } = require("../../config/nodemailer.js");
const { redisConfig } = require("../../redis/config.js");
const cloudinary = require("cloudinary").v2;

class Course {
	async getCourseInformation(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "course-id": courseId } = req.query;
			const { "user id": userId } = req.user;
			let response = await conn.query("CALL SP_GetCourseInformation(?,?)", [courseId, userId]);
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
			const { "user id": userId } = req.user;
			let response = await conn.query("CALL SP_GetCourseContent(?, ?)", [courseId, userId]); // limit 20
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
			const { "user id": userId } = req.user;
			let response = await conn.query("CALL SP_GetCourseComment(?,?)", [courseId, userId]);
			let comments = new Map();
			let array = response[0][0];
			// chia cac comment thanh 2 loai: feedback va replies
			for (let item of array) {
				if (item["reply comment id"] === null) {
					comments.set(item["comment id"], {
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
					});
				} else {
					comments.get(item["reply comment id"]).replies.push({
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
			let commentArray = [...comments.values()];
			res.status(200).json(commentArray);
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
			res.status(200).json({ updatedCourse: response[0][0], messageCode: "UPDATE_COURSE_SUCCESS" });
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
			const { "user id": userId } = req.user;

			const responseSQl = await conn.query("CALL SP_GetCoursePrice(?,?)", [courseId, userId]);
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

			let result = await redisConfig.get(
				`searchcourse:${textSearch}-${targetLanguageId}-${sourceLanguageId}-${courseLevelId}-${minPrice}-${maxPrice}-${nLimit}-${nPage}`,
			);

			if (result) {
				return res.status(200).json(JSON.parse(result));
			}

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

			redisConfig.set(
				`searchcourse:${textSearch}-${targetLanguageId}-${sourceLanguageId}-${courseLevelId}-${minPrice}-${maxPrice}-${nLimit}-${nPage}`,
				JSON.stringify({ courses: responseSql[0][0], totalPages: responseSql[0][1][0]?.["total pages"], type }),
				"EX",
				60, // 60s
			);

			res.status(200).json({ courses: responseSql[0][0], totalPages: responseSql[0][1][0]?.["total pages"], type });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async listCourses(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { ci = null, ri = null, tli = null, sli = null, mnp = 0, mxp = 0, np = 1, lm = 20 } = req.query;
			const query = `CALL SP_AdminCourseView(${ci ? ci : null},${ri ? ri : null},${tli ? tli : null},${sli ? sli : null},${mnp},${mxp},${np},${lm})`;

			let responseSql = await conn.query(query);

			res.status(200).json({ courses: responseSql[0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async disableCourse(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId } = req.body;

			if (!courseId) {
				res.status(404).json({ errorCode: "COURSE_NOT_FOUND" });
			}

			let response = await conn.query("CALL SP_DisableCourse(?,?)", [userId, courseId]);

			res.status(200).json({ messageCode: "DISABLE_COURSE_SUCCESS", ...response[0][0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async enableCourse(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId } = req.body;

			if (!courseId) {
				res.status(404).json({ errorCode: "COURSE_NOT_FOUND" });
			}

			let response = await conn.query("CALL SP_EnableCourse(?,?)", [userId, courseId]);

			res.status(200).json({ messageCode: "ENABLE_COURSE_SUCCESS", ...response[0][0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async getPendingCourse(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { li = 10, np = 1 } = req.query;

			let response = await conn.query("CALL SP_AdminListCoursePending(?,?)", [li, np]);

			res.status(200).json({ courses: response[0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async approveCourse(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { courseId } = req.body;

			await conn.query("CALL SP_AdminApproveCourse(?)", [courseId]);

			res.status(200).json({ courseId: courseId });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async rejectCourse(req, res) {
		let conn;
		try {
			let defaultReason = `We regret to inform you that your course submission has been rejected as the content and information provided do not align with our platform's policies and educational standards. 
			The course materials require significant improvements in terms of quality, organization, and learning objectives to meet our requirements. We encourage you to review our course creation guidelines and resubmit after making the necessary adjustments.`;
			conn = await pool.getConnection();
			const { courseId, rejectContent } = req.body;

			let response = await conn.query("CALL SP_AdminRejectCourse(?)", [courseId]);

			// handle email
			transporter.sendMail({
				from: {
					name: "StudyTogether😊",
					address: process.env.NODEMAILER_USER,
				}, // sender address
				to: response[0][0][0]?.["email"], // list of receivers
				subject: "Course rejection ❌", // Subject line
				text: "Hello, my friend. Your posting course was reject with some reasons", // plain text body
				html: `
				<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1.0" />
					<link rel="stylesheet" href="src/style.css" />
				</head>
				<body>
					<div
					class="email-container"
					style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;"
					>
					<div
						class="header"
						style="background: #f44336; color: white; padding: 20px; text-align: center;">
						<h1>Reject your posting course</h1>
					</div>
					<div class="course-info" style="padding: 20px; background: #fff;">
						<div
						class="course-header"
						style="display: flex; gap: 20px; margin-bottom: 20px;"
						>
						<img
							class="course-image"
							src="${response[0][0][0]?.["image"]}"
							alt="Ảnh khóa học"
							style="width: 200px; height: 150px; object-fit: cover;"
						/>

						<div class="course-details">
							<h2 class="course-name" style="margin: 0 0 10px 0; color: #333;">
							${response[0][0][0]?.["name"]}
							</h2>
							<div class="course-tags" style="margin-bottom: 10px;">
							<span
								class="tag"
								style="background: #e0e0e0; padding: 5px 10px; border-radius: 15px; margin-right: 5px;"
							>
								${response[0][0][0]?.["tag"]}
							</span>
							</div>
						</div>
						</div>

						<!-- Course Description -->
						<div
						class="course-description"
						style="background: #f5f5f5; padding: 15px; border-radius: 5px;"
						>
						<h3 style="margin-top: 0;">Your course description</h3>
						<p style="color: #666;"><strong>Short description: </strong>${response[0][0][0]?.["short description"]}</p>
						<p style="color: #666;"><strong>Detail description: </strong>${response[0][0][0]?.["detailed description"]}</p>
						</div>
						<div
						class="rejection-message"
						style="margin-top: 20px; padding: 15px; border-left: 4px solid #f44336;"
						>
						<h3 style="color: #f44336; margin-top: 0;">Reason for rejection:</h3>
						<p>${rejectContent || defaultReason}</p>
						</div>
						<div
						class="footer"
						style="margin-top: 30px; text-align: center; color: #666;"
						>
						<p>
							If you have any questions, please contact us via email:
							${process.env.NODEMAILER_USER}
						</p>
						</div>
					</div>
					</div>
				</body>
				</html>

				`, // html body
			});

			res.status(200).json({ courseId: courseId });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async getUserOwnedCourse(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { userId } = req.params;
			let sqlResponse = await conn.query("CALL SP_AdminViewCourseOwner(?)", [userId]);
			res.status(200).json({ courses: sqlResponse[0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}

	async getUserEnrolledCourse(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { userId } = req.params;
			let sqlResponse = await conn.query("CALL SP_AdminViewUserCourseEnrollment(?)", [userId]);
			res.status(200).json({ courses: sqlResponse[0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}
}

module.exports = new Course();
