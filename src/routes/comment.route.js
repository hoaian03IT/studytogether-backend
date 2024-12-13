const router = require("express").Router();
const CommentController = require("../app/controllers/comment.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.post("/feedback", [authenticate], CommentController.createFeedbackComment);
router.post("/reply", [authenticate], CommentController.createReplyComment);
module.exports = router;
