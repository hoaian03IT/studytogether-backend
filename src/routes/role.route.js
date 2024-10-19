const router = require("express").Router();
const RoleController = require("../app/controllers/role.controller");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
    console.log("Time: ", Date.now());
    next();
};
router.use(timeLog);

router.get("/all", RoleController.getAllRoles);

module.exports = router;
