const { pool } = require("../../connectDB");

class LevelCourseControllerClass {
    async getLevelCourseByLanguage(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();
            const { "language-id": languageId } = req.query;

            conn.query(
                "SELECT `language id`,`course level id`,`course level name`,description FROM `course levels` WHERE `language id`=? ORDER BY `course level name`",
                [languageId]
            )
                .then((response) => {
                    res.status(200).json({ levelCourses: response[0] });
                })
                .catch((error) => {
                    res.status(500).json({ message: error.message });
                });
        } catch (error) {
            res.status(500).json({ message: error.message });
        } finally {
            pool.releaseConnection(conn);
        }
    }
}

module.exports = new LevelCourseControllerClass();
