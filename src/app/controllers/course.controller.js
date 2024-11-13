const { pool } = require("../../connectDB");
const { uploadImage } = require("../../utils/uploadToCloud");
const cloudinary = require("cloudinary").v2;

class Course {
	async getCourseInformation(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "course-id": courseId } = req.query;
			conn.query("CALL SP_GetCourseInformation(?)", [courseId])
				.then(response => {
					res.status(200).json(response[0][0][0]);
				})
				.catch(error => {
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

	async getCourseContent(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "course-id": courseId } = req.query;
			conn.query("CALL SP_GetCourseContent(?)", [courseId])
				.then(response => {
					let content = { courseId, levels: [] };
					let array = response[0][0];
					let levels = [];

					let currentLevelId = array[0]["level id"];
					let count = 0;
					// chuyen cac record thanh dang array: {levelId: X, words: [{'word id': X, word: X, type: X, definition: X}]}
					levels.push({ levelId: currentLevelId, levelName: array[0]["level name"], words: [] });
					for (let item of array) {
						if (item["level id"] !== currentLevelId) {
							currentLevelId = item["level id"];
							count++;
							levels.push({ levelId: item["level id"], levelName: item["level name"], words: [] });
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
				})
				.catch(error => {
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

	async getCourseComment(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "course-id": courseId } = req.query;
			conn.query("CALL SP_GetCourseComment(?)", [courseId])
				.then(response => {
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
				.catch(error => {
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

	async getCourseLanguages(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "course-id": courseId } = req.query;
			const response = await conn.query("CALL SP_GetCourseLanguages(?)", [courseId]);
			res.status(200).json({ ...response[0][0][0] });
		} catch (error) {
			res.status(500).json({ message: error.message });
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async createCourseInformation(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;

			let {
				courseName,
				sourceLanguageId,
				courseLevelId,
				tag = "",
				shortDescription = "",
				detailedDescription = "",
				image,
			} = req.body;

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

			conn.query("CALL SP_CreateCourse(?,?,?,?,?,?,?,?)", [
				userId,
				courseName,
				sourceLanguageId,
				courseLevelId,
				tag,
				shortDescription,
				detailedDescription,
				image,
			])
				.then((response) => {
					res.status(200).json({ newCourse: response[0][0] });
				})
				.catch((err) => {
					res.status(500).json({ message: err.message });
				});

		} catch (error) {
			res.status(500).json({ message: error.message });
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async updateCourseInformation(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			let {
				courseId,
				courseName,
				sourceLanguageId,
				courseLevelId,
				tag,
				shortDescription,
				detailedDescription,
				image,
				isPrivate = false,
			} = req.body;

			if (!courseId || !userId) {
				res.status(401).json({ errorCode: "MISS_PARAMETER" });
			}


			if (image) {
				image = await uploadImage(image, [tag]);
			}

			conn.query("CALL SP_UpdateCourseInformation(?,?,?,?,?,?,?,?,?,?)", [
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
			])
				.then((response) => {
					res.status(200).json({ updatedCourse: response[0][0] });
				})
				.catch((error) => {
					if (error.sqlState == 45000) {
						res.status(404).json({ errorCode: "COURSE_NOT_FOUND" });
					} else if (error.sqlState == 45001) {
						res.status(404).json({ errorCode: "LEVEL_LANGUAGE_NOT_FOUND" });
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

	async destroyOwnCourse(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const { courseId } = req.params;

			conn.query("CALL SP_DestroyOwnCourse(?, ?)", [courseId, userId])
				.then(() => {
					res.status(200).json({ message: "Delete your course successfully" });
				})
				.catch((err) => {
					if (err.sqlCode === 45000 || err.sqlCode === 45001) {
						res.status(401).json({ message: err.message });
					} else {
						// ở đây sẽ thông báo lỗi server
						res.status(401).json({ message: err.message });
					}
				});
		} catch (error) {
			res.status(401).json({ message: error.message });
		} finally {
			pool.releaseConnection(conn);
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
			console.error(error);
			res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async updateCoursePrice(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { "user id": userId } = req.user;
			const {
				courseId,
				newPrice,
				newDiscount,
				discountFrom = null,
				discountTo = null,
				currency = "USD",
			} = req.body;

			if (!courseId) {
				res.status(404).json({ errorCode: "COURSE_NOT_FOUND" });
			}

			let responseSql = await conn.query("CALL SP_UpdatePrice(?,?,?,?,?,?,?)", [userId, courseId, newPrice, newDiscount, currency, discountFrom, discountTo]);
			res.status(200).json({ updatedPrice: responseSql[0][0], messageCode: "UPDATE_SUCCESS" });


		} catch (error) {
			console.error(error);
			if (error.sqlState == 45000) {
				res.status(404).json({ errorCode: "COURSE_NOT_FOUND" });
			} else {

				res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
			}
		} finally {
			pool.releaseConnection(conn);
		}
	}
}

module.exports = new Course();
