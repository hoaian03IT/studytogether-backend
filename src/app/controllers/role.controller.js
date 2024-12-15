const { pool } = require("../../db/connectDB.js");
const { CommonHelpers } = require("../helpers/commons");

class Role {
	async getAllRoles(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			let response = await conn.query("CALL SP_GetRoles()");
			res.status(200).json({ roles: response[0][0] });
		} catch (error) {
			CommonHelpers.handleError(error, res);
		} finally {
			await CommonHelpers.safeRelease(pool, conn);
		}
	}
}

module.exports = new Role();
