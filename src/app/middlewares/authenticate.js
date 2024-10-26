const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
	try {
		const textInsideToken = "Bearer";
		const splitted = req.headers.authorization?.split(" ");
		if (!splitted || splitted[0] !== textInsideToken) {
			return res.status(401).json({ message: "Unauthenticated 1" });
		}
		const token = req.headers.authorization.split(" ")[1];
		if (!token) {
			return res.status(401).json({ message: "Unauthenticated 2" });
		}

		jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
			if (err) return res.status(401).json({ message: "Unauthenticated 3" });
			req.user = user;
			next();
		});
	} catch (error) {
		return res.status(401).json({ message: error.message });
	}
}

module.exports = { authenticate };
