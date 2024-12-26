const router = require("express").Router();
const UserController = require("../app/controllers/user.controller");
const { authenticate } = require("../app/middlewares/authenticate");
const logUserActivity = require("../app/middlewares/user-activity-log");
const { verifyAdmin } = require("../app/middlewares/verifyRole");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.get("/me", [authenticate], UserController.getUserInfo);
router.post("/update-info", [authenticate, logUserActivity], UserController.updateUserInfo);
router.get("/exists-username", UserController.checkExistUsername);

// admin
router.get("/admin/list-users", [authenticate, verifyAdmin], UserController.getUserList);
router.post("/admin/disable-user", [authenticate, verifyAdmin, logUserActivity], UserController.disableUser);
router.post("/admin/enable-user", [authenticate, verifyAdmin, logUserActivity], UserController.enableUser);
router.get("/admin/user-details/:id", [authenticate, verifyAdmin], UserController.getUserDetails);

module.exports = router;
