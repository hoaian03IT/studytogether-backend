const { pool } = require("../../connectDB");
const imageToBlob = require("../../utils/imageToBlob");
const path = require("path");

class Course {
    async createCourseInformation(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();

            let {
                courseName,
                sourceLanguageId,
                courseLevelId,
                tag = "",
                shortDescription = "",
                detailedDescription = "",
                image,
            } = req.body;

            const { userId } = req.user;

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

            pool.releaseConnection(conn);
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
            const { userId } = req.user;
            const {
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
                res.status(401).json({ messageCode: "MISS_PARAMETER" });
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
                    console.log(response);
                    res.status(200).json({ updatedCourse: response[0][0] });
                })
                .catch((error) => {
                    if (error.sqlState == 45000) {
                        res.status(404).json({ messageCode: "COURSE_NOT_FOUND" });
                    } else if (error.sqlState == 45001) {
                        res.status(404).json({ messageCode: "LEVEL_LANGUAGE_NOT_FOUND" });
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
            const { userId } = req.user;
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
}

module.exports = new Course();
