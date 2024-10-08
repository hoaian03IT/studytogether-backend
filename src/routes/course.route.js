const router = require("express").Router();
const CourseController = require("../app/controllers/course.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
    console.log("Time: ", Date.now());
    next();
};
router.use(timeLog);

router.post("/create", [authenticate], CourseController.login);

module.exports = router;
