const router = require("express").Router();
const UserController = require("../app/controllers/user.controller");
const { authenticate } = require("../app/middlewares/authenticate");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.get("/me", [authenticate], UserController.getUserInfo);
router.post("/update-info", [authenticate], UserController.updateUserInfo);
router.get("/exists-username", UserController.checkExistUsername);

module.exports = router;
