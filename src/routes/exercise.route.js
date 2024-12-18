const router = require("express").Router();
const ExerciseController = require("../app/controllers/exercise.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");
const { verifyRoleAdminTeacher } = require("../app/middlewares/verifyRole.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.get("/", [authenticate], ExerciseController.getExerciseByLevel);
router.post("/new", [authenticate, verifyRoleAdminTeacher], ExerciseController.addNewExercise);
router.post("/edit", [authenticate, verifyRoleAdminTeacher], ExerciseController.updateExercise);
router.delete("/delete", [authenticate, verifyRoleAdminTeacher], ExerciseController.disableExercise);

module.exports = router;
