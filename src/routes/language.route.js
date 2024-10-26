const router = require("express").Router();
const LanguageController = require("../app/controllers/language.controller");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
    console.log("Time: ", Date.now());
    next();
};
router.use(timeLog);

router.get("/all", LanguageController.getLanguages);

module.exports = router;
