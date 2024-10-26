const { pool } = require("../../connectDB");

class LanguageControllerClass {
    async getLanguages(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();

            conn.query("SELECT `language id`, `language name`, `abbreviation`, image FROM languages")
                .then((response) => {
                    res.status(200).json({ languages: response[0] });
                })
                .catch((error) => {
                    res.status(500).json({ error: error.message });
                });
        } catch (error) {
            res.status(500).json({ error: error.message });
        } finally {
            pool.releaseConnection(conn);
        }
    }
}

module.exports = new LanguageControllerClass();
