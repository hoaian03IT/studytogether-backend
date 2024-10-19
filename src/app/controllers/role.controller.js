const { pool } = require("../../connectDB");

class Role {
    async getAllRoles(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();
            conn.query(
                "SELECT `role id`, `role name` FROM roles WHERE LOWER(`role name`) NOT IN ('admin', 'administrator')"
            )
                .then(([records]) => {
                    res.status(200).json(records);
                })
                .catch((err) => res.status(400).json({ message: err.message }));
        } catch (error) {
            res.status(401).json({ message: error.message });
        } finally {
            pool.releaseConnection(conn);
        }
    }
}

module.exports = new Role();
