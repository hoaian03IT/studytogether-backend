const router = require("express").Router();
const CourseController = require("../app/controllers/course.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
    console.log("Time: ", Date.now());
    next();
};
router.use(timeLog);

router.post("/create", [authenticate], CourseController.createCourseInformation);
router.delete("/destroy/:courseId", [authenticate], CourseController.destroyOwnCourse);

module.exports = router;
