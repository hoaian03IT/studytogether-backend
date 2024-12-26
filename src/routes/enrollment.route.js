const router = require("express").Router();
const EnrollmentController = require("../app/controllers/enrollment.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");
const logUserActivity = require("../app/middlewares/user-activity-log.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.post("/create-enrollment", [authenticate, logUserActivity], EnrollmentController.createEnrollment);
router.get("/enrollment-information", [authenticate], EnrollmentController.getEnrollmentInfo);
router.post("/restart", [authenticate, logUserActivity], EnrollmentController.restartEnrollment);
router.post("/quit", [authenticate, logUserActivity], EnrollmentController.quitEnrollment);
module.exports = router;
