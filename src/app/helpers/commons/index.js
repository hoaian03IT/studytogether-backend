class CommonHelpers {
	/**
	 * Helper function to release connection safely
	 */
	static async safeRelease(pool, conn) {
		if (conn) await pool.releaseConnection(conn);
	}

	/**
	 * Helper function to handle errors
	 */
	static handleError(error, res) {
		console.error(error);
		if (error?.sqlState >= 45000 && error?.sqlState <= 45100) {
			res.status(406).json({ errorCode: error?.sqlMessage });
		} else {
			res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
		}
	}

	static getISOStringEnrollmentExpiration() {
		const enrollmentExpiration = Number(process.env.ENROLLMENT_EXPIRATION);

		let expire = new Date().setTime(new Date().getTime() + enrollmentExpiration);
		expire = new Date(expire).toISOString().replace("Z", "");
		return expire;
	}
}

module.exports = { CommonHelpers };
