const router = require("express").Router();
const AuthController = require("../app/controllers/auth.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
    console.log("Time: ", Date.now());
    next();
};
router.use(timeLog);

router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.post("/logout", [authenticate], AuthController.logout);
router.get("/refresh-token", AuthController.refreshToken);

module.exports = router;
