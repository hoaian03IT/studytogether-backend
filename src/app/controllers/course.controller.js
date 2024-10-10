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
                languageTeach,
                languageFor,
                courseLevelId,
                tag,
                shortDescription = "",
                detailedDescription = "",
                image,
                isPrivate = false,
            } = req.body;

            const { userId } = req.user;

            const defaultImagePath = path.join(__dirname, "../../../public", "default-course-thumbnail.png");
            image = imageToBlob(defaultImagePath);

            if (!image) image = defaultImageCourse;

            conn.query("CALL SP_CreateCourse(?,?,?,?,?,?,?,?,?,?)", [
                userId,
                courseName,
                languageTeach,
                languageFor,
                courseLevelId,
                tag,
                shortDescription,
                detailedDescription,
                image,
                isPrivate,
            ])
                .then((response) => {
                    res.status(200).json(response[0][0][0]);
                })
                .catch((err) => {
                    res.status(400).json({ message: err.message });
                });

            pool.releaseConnection(conn);
        } catch (error) {
            res.status(401).json({ message: error.message });
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
