const router = require("express").Router();
const CourseController = require("../app/controllers/course.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");
const { verifyAdmin } = require("../app/middlewares/verifyRole.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.get("/overview", [authenticate], CourseController.getCourseInformation);
router.get("/comment", [authenticate], CourseController.getCourseComment);
router.get("/content", [authenticate], CourseController.getCourseContent);
router.get("/languages", CourseController.getCourseLanguages);
router.get("/prices", [authenticate], CourseController.getCoursePrice);
router.get("/own-course", [authenticate], CourseController.getOwnCourses);
router.get("/enrolled-course", [authenticate], CourseController.getEnrolledCourse);
router.get("/search-course", CourseController.searchCourse);
router.post("/create", [authenticate], CourseController.createCourseInformation);
router.post("/update", [authenticate], CourseController.updateCourseInformation);
router.delete("/destroy/:courseId", [authenticate], CourseController.destroyOwnCourse);
router.post("/price-update", [authenticate], CourseController.updateCoursePrice);

// admin
router.get("/admin/all", [authenticate, verifyAdmin], CourseController.listCourses);
router.post("/admin/disable-course", [authenticate, verifyAdmin], CourseController.disableCourse);
router.post("/admin/enable-course", [authenticate, verifyAdmin], CourseController.enableCourse);
router.post("/admin/approve-course", [authenticate, verifyAdmin], CourseController.approveCourse);
router.post("/admin/reject-course", [authenticate, verifyAdmin], CourseController.rejectCourse);
router.get("/admin/pending-courses", [authenticate, verifyAdmin], CourseController.getPendingCourse);

module.exports = router;
