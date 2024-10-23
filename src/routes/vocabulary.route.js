const router = require("express").Router();
const VocabularyController = require("../app/controllers/vocabulary.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
    console.log("Time: ", Date.now());
    next();
};
router.use(timeLog);

router.get("/all/:courseId", [authenticate], VocabularyController.getAllVocabulary);
router.post("/new", [authenticate], VocabularyController.addNewWord);
router.post("/edit", [authenticate], VocabularyController.updateWord);
router.delete("/delete", [authenticate], VocabularyController.deleteWord);

module.exports = router;
