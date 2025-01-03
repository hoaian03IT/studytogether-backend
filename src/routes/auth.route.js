const router = require("express").Router();
const AuthController = require("../app/controllers/auth.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");
const logUserActivity = require("../app/middlewares/user-activity-log.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.post("/login/google", AuthController.googleLogin);
router.post("/login/facebook", AuthController.facebookLogin);
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.post("/logout", [authenticate], AuthController.logout);
router.get("/refresh-token", AuthController.refreshToken);
router.post("/forgot-password", AuthController.forgotPassword); // api: /auth/forgot-password
router.post("/change-password", [authenticate, logUserActivity], AuthController.changePassword);

module.exports = router;
