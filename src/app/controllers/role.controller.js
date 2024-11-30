const { pool } = require("../../connectDB");
const { CommonHelpers } = require("../helpers/commons");

class Role {
	async getAllRoles(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			conn.query(
				"SELECT `role id`, `role name` FROM roles WHERE LOWER(`role name`) NOT IN ('admin', 'administrator')",
			)
				.then(([records]) => {
					res.status(200).json(records);
				})
				.catch((err) => res.status(400).json({ message: err.message }));
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}
}

module.exports = new Role();
