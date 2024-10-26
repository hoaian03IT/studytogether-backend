const { pool } = require("../../connectDB.js");

class User {
    async getUserInfo(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();
        } catch (error) {
            res.status(403).json(error.message);
        } finally {
            pool.releaseConnection(conn);
        }
    }
}

module.exports = new User();
