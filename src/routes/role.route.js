const router = require("express").Router();
const RoleController = require("../app/controllers/role.controller");
const { authenticate } = require("../app/middlewares/authenticate");
const { verifyAdmin } = require("../app/middlewares/verifyRole");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.get("/all", [authenticate, verifyAdmin], RoleController.getAllRoles);

module.exports = router;
