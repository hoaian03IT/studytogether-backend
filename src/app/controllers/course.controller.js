const { pool } = require("../../connectDB");

class Course {
    async createCourseInformation(req, res) {
        try {
            const conn = await pool.getConnection();

            const {
                courseName,
                languageTeach,
                languageFor,
                levelId,
                tag,
                shortDescription,
                detailedDescription,
                image,
                isPrivate = false,
            } = req.body;

            const { userId } = req.user;

            conn.query("CALL SP_CreateCourse(?,?,?,?,?,?,?,?,?,?)", [
                userId,
                courseName,
                languageTeach,
                languageFor,
                levelId,
                tag,
                shortDescription,
                detailedDescription,
                image,
                isPrivate,
            ])
                .then(([response]) => {
                    res.status(200).json({ message: response[0][0].message });
                })
                .catch((err) => {
                    res.status(400).json({ message: err.message });
                });

            pool.releaseConnection(conn);
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    }
}

module.exports = new Course();
