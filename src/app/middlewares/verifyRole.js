const verifyAdmin = (req, res, next) => {
	if (req.user?.["role name"] !== "admin") {
		return res.status(403).json({ messageCode: "NOT_HAVE_PERMISSION" });
	}
	next();
};

module.exports = { verifyAdmin };
