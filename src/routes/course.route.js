const router = require("express").Router();
const CourseController = require("../app/controllers/course.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");
const logUserActivity = require("../app/middlewares/user-activity-log.js");
const { verifyAdmin, verifyRoleAdminTeacher } = require("../app/middlewares/verifyRole.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

// log user activity

router.get("/overview", [authenticate], CourseController.getCourseInformation);
router.get("/comment", [authenticate], CourseController.getCourseComment);
router.get("/content", [authenticate], CourseController.getCourseContent);
router.get("/languages", CourseController.getCourseLanguages);
router.get("/prices", [authenticate], CourseController.getCoursePrice);
router.get("/own-course", [authenticate], CourseController.getOwnCourses);
router.get("/enrolled-course", [authenticate], CourseController.getEnrolledCourse);
router.get("/search-course", CourseController.searchCourse);
router.post("/create", [authenticate, logUserActivity], CourseController.createCourseInformation);
router.post("/update", [authenticate, logUserActivity], CourseController.updateCourseInformation);
router.delete("/destroy/:courseId", [authenticate, logUserActivity], CourseController.destroyOwnCourse);
router.post("/price-update", [authenticate, verifyRoleAdminTeacher, logUserActivity], CourseController.updateCoursePrice);

// admin
router.get("/admin/all", [authenticate, verifyAdmin], CourseController.listCourses);
router.post("/admin/disable-course", [authenticate, verifyAdmin, logUserActivity], CourseController.disableCourse);
router.post("/admin/enable-course", [authenticate, verifyAdmin, logUserActivity], CourseController.enableCourse);
router.post("/admin/approve-course", [authenticate, verifyAdmin, logUserActivity], CourseController.approveCourse);
router.post("/admin/reject-course", [authenticate, verifyAdmin, logUserActivity], CourseController.rejectCourse);
router.get("/admin/pending-courses", [authenticate, verifyAdmin], CourseController.getPendingCourse);
router.get("/admin/user-owned-courses/:userId", [authenticate, verifyAdmin], CourseController.getUserOwnedCourse);
router.get("/admin/user-enrolled-courses/:userId", [authenticate, verifyAdmin], CourseController.getUserEnrolledCourse);

module.exports = router;
