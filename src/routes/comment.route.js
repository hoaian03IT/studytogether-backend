const router = require("express").Router();
const CommentController = require("../app/controllers/comment.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");
const logUserActivity = require("../app/middlewares/user-activity-log.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.get("/rate/:courseId", CommentController.getCourseRates);
router.post("/feedback", [authenticate, logUserActivity], CommentController.createFeedbackComment);
router.post("/reply", [authenticate, logUserActivity], CommentController.createReplyComment);
module.exports = router;
