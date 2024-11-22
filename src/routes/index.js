const authRoute = require("./auth.route.js");
const courseRoute = require("./course.route.js");
const roleRoute = require("./role.route.js");
const vocabularyRoute = require("./vocabulary.route.js");
const levelRoute = require("./level.route.js");
const exampleRoute = require("./example.route.js");
const userRoute = require("./user.route.js");
const levelCourseRoute = require("./levelCourse.route.js");
const languageRoute = require("./language.route.js");
const exerciseRoute = require("./exercise.route.js");
const paymentRoute = require("./payment.route.js");
const enrollmentRoute = require("./enrollment.route.js");
const learnProcessRoute = require("./learn-process.route.js");

function route(app) {
	app.use("/auth", authRoute);
	app.use("/level-course", levelCourseRoute);
	app.use("/language", languageRoute);
	app.use("/course", courseRoute);
	app.use("/role", roleRoute);
	app.use("/vocabulary", vocabularyRoute);
	app.use("/level", levelRoute);
	app.use("/example", exampleRoute);
	app.use("/user", userRoute);
	app.use("/exercise", exerciseRoute);
	app.use("/payment", paymentRoute);
	app.use("/enrollment", enrollmentRoute);
	app.use("/learn", learnProcessRoute);
}

module.exports = route;
