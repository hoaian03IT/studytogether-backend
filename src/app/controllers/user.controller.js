const { pool } = require("../../connectDB.js");


class User {
	async getUserInfo(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { email } = req.user;

			conn.query("CALL SP_GetUserAccount(?)", [email])
				.then(response => {
					const { hashpassword, "user id": id, ...rest } = response[0][0][0];
					res.status(200).json({ ...rest });
				})
				.catch(error => {
					res.status(500).json(error.message);
				});
		} catch (error) {
			res.status(500).json(error.message);
		} finally {
			pool.releaseConnection(conn);
		}
	}
}

module.exports = new User();
