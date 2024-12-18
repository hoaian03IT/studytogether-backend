const verifyAdmin = (req, res, next) => {
	if (req.user?.["role name"]?.toLowerCase() !== process.env.ADMIN_ROLE) {
		return res.status(403).json({ errorCode: "NOT_HAVE_PERMISSION" });
	}
	next();
};

const verifyTeacher = (req, res, next) => {
	if (req.user?.["role name"]?.toLowerCase() !== process.env.TEACHER_ROLE) {
		return res.status(403).json({ errorCode: "NOT_HAVE_PERMISSION" });
	}
	next();
};

const verifyRoleAdminTeacher = (req, res, next) => {
	if (req.user?.["role name"]?.toLowerCase() !== process.env.TEACHER_ROLE && req.user?.["role name"]?.toLowerCase() !== process.env.ADMIN_ROLE) {
		return res.status(403).json({ errorCode: "NOT_HAVE_PERMISSION" });
	}
	next();
};

module.exports = { verifyAdmin, verifyTeacher, verifyRoleAdminTeacher };
