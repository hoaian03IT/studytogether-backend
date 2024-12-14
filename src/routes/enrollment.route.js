const router = require("express").Router();
const EnrollmentController = require("../app/controllers/enrollment.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.post("/create-enrollment", [authenticate], EnrollmentController.createEnrollment);
router.get("/enrollment-information", [authenticate], EnrollmentController.getEnrollmentInfo);
router.post("/restart", [authenticate], EnrollmentController.restartEnrollment);
router.post("/quit", [authenticate], EnrollmentController.quitEnrollment);
module.exports = router;
