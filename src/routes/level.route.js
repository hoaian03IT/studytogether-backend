const router = require("express").Router();
const LevelController = require("../app/controllers/level.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
    console.log("Time: ", Date.now());
    next();
};
router.use(timeLog);

router.get("/all/:courseId", [authenticate], LevelController.getAllLevels);
router.post("/new", [authenticate], LevelController.addNewCourseLevel);
router.post("/edit", [authenticate], LevelController.updateCourseLevel);
router.delete("/delete", [authenticate], LevelController.deleteCourseLevel);

module.exports = router;
