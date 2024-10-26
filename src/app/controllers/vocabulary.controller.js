const { pool } = require("../../connectDB");

class VocabularyControllerClass {
    async getAllVocabulary(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();
            const { userId } = req.user;
            const { courseId } = req.params;
            if (!courseId) return res.status(404).json({ message: "Not found" });

            const [records] = await conn.query("CALL SP_GetAllWords(?, ?)", [courseId, userId]);
            res.status(200).json({ vocabularyList: records[0] });
        } catch (error) {
            res.status(500).json({ message: error.message });
        } finally {
            pool.releaseConnection(conn);
        }
    }

    async addNewWord(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();
            const { userId } = req.user;
            const { courseId, levelId, word, definition, image, pronunciation, type } = req.body;
            if (!courseId) return res.status(404).json({ message: "Not found" });

            conn.query("CALL SP_InsertNewWord(?,?,?,?,?,?,?,?)", [
                courseId,
                userId,
                word,
                definition,
                image,
                pronunciation,
                levelId,
                type,
            ])
                .then((response) => {
                    res.status(200).json({ newWord: response[0][0] });
                })
                .catch((err) => {
                    res.status(400).json({ message: err.message });
                });
        } catch (error) {
            res.status(500).json({ message: error.message });
        } finally {
            pool.releaseConnection(conn);
        }
    }

    async updateWord(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();
            const { userId } = req.user;
            const { courseId, levelId, wordId, word, definition, image, pronunciation, type } = req.body;
            if (!courseId || !levelId || !wordId) return res.status(404).json({ message: "Not found" });

            conn.query("CALL SP_UpdateWord(?,?,?,?,?,?,?,?,?)", [
                courseId,
                userId,
                levelId,
                wordId,
                word,
                type,
                definition,
                image,
                pronunciation,
            ])
                .then((response) => {
                    res.status(200).json({ newWord: response[0][0] });
                })
                .catch((err) => {
                    res.status(400).json({ message: err.message });
                });
        } catch (error) {
            res.status(500).json({ message: error.message });
        } finally {
            pool.releaseConnection(conn);
        }
    }

    async deleteWord(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();
            const { userId } = req.user;
            const { courseId, levelId, wordId } = req.body;
            if (!courseId || !levelId || !wordId) return res.status(404).json({ message: "Not found" });

            conn.query("CALL SP_DeleteWord(?,?,?,?)", [courseId, userId, levelId, wordId])
                .then(() => {
                    res.status(200).json({ messageCode: "DELETE_SUCCESS" });
                })
                .catch((err) => {
                    res.status(400).json({ message: err.message });
                });
        } catch (error) {
            res.status(500).json({ message: error.message });
        } finally {
            pool.releaseConnection(conn);
        }
    }
}

const VocabularyController = new VocabularyControllerClass();

module.exports = VocabularyController;
