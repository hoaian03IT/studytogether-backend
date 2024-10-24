const router = require("express").Router();
const ExampleController = require("../app/controllers/example.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
    console.log("Time: ", Date.now());
    next();
};
router.use(timeLog);

router.get("/all", [authenticate], ExampleController.getAllExamplesByCourse);
router.post("/new", [authenticate], ExampleController.addNewExample);
router.post("/edit", [authenticate], ExampleController.updateExample);
router.delete("/delete", [authenticate], ExampleController.disableExample);

module.exports = router;
