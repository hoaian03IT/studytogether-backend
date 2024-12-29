const router = require("express").Router();
const VocabularyController = require("../app/controllers/vocabulary.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");
const logUserActivity = require("../app/middlewares/user-activity-log.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.get("/all/:courseId", [authenticate], VocabularyController.getAllVocabulary);
router.post("/new", [authenticate, logUserActivity], VocabularyController.addNewWord);
router.post("/edit", [authenticate, logUserActivity], VocabularyController.updateWord);
router.delete("/delete", [authenticate, logUserActivity], VocabularyController.deleteWord);
router.get("/learnt-words/:enrollmentId", [authenticate], VocabularyController.getLearntWordsByEnrollment);
router.get("/marked-words/:enrollmentId", [authenticate], VocabularyController.getMarkedWordsByEnrollment);

module.exports = router;
