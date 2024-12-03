const router = require("express").Router();
const { NotificationController } = require("../app/controllers/notification.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.get("/get", [authenticate], NotificationController.getNotification);
router.get("/get-all", [authenticate], NotificationController.getAllNotifications);


module.exports = router;
