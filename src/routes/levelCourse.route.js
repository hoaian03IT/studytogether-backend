const router = require("express").Router();
const LevelCourseController = require("../app/controllers/levelCourse.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
    console.log("Time: ", Date.now());
    next();
};
router.use(timeLog);

router.get("/all", LevelCourseController.getLevelCourseByLanguage);

module.exports = router;
