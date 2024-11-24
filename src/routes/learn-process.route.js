const router = require("express").Router();
const LearnProcessController = require("../app/controllers/learn-process.controller");
const { authenticate } = require("../app/middlewares/authenticate");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.get("/new-words", [authenticate], LearnProcessController.getLearnNewWords);
router.post("/update-new-words", [authenticate], LearnProcessController.createLearnProgress);

module.exports = router;
