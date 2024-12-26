const router = require("express").Router();
const LearnProcessController = require("../app/controllers/learn-process.controller");
const { authenticate } = require("../app/middlewares/authenticate");
const logUserActivity = require("../app/middlewares/user-activity-log");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.get("/new-words", [authenticate], LearnProcessController.getLearnNewWords);
router.get("/speed-review", [authenticate], LearnProcessController.speedReview);
router.post("/update-new-words", [authenticate, logUserActivity], LearnProcessController.createLearnProgress);
router.post("/update-progress", [authenticate, logUserActivity], LearnProcessController.updateLearnProgress);

module.exports = router;
