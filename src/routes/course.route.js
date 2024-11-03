const router = require("express").Router();
const CourseController = require("../app/controllers/course.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.get("/overview", CourseController.getCourseInformation);
router.get("/comment", CourseController.getCourseComment);
router.get("/content", CourseController.getCourseContent);
router.get("/languages", CourseController.getCourseLanguages);
router.post("/create", [authenticate], CourseController.createCourseInformation);
router.post("/update", [authenticate], CourseController.updateCourseInformation);
router.delete("/destroy/:courseId", [authenticate], CourseController.destroyOwnCourse);

module.exports = router;
