const router = require("express").Router();
const ExampleController = require("../app/controllers/example.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");
const logUserActivity = require("../app/middlewares/user-activity-log.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.get("/all", [authenticate], ExampleController.getAllExamplesByCourse);
router.post("/new", [authenticate, logUserActivity], ExampleController.addNewExample);
router.post("/edit", [authenticate, logUserActivity], ExampleController.updateExample);
router.delete("/delete", [authenticate, logUserActivity], ExampleController.disableExample);

module.exports = router;
