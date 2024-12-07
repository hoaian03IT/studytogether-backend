const router = require("express").Router();
const ExerciseController = require("../app/controllers/exercise.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.get("/", [authenticate], ExerciseController.getExerciseByLevel);
router.post("/new", [authenticate], ExerciseController.addNewExercise);
router.post("/edit", [authenticate], ExerciseController.updateExercise);
router.delete("/delete", [authenticate], ExerciseController.disableExercise);

module.exports = router;
