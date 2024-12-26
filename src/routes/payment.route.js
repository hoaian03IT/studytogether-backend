const router = require("express").Router();
const PaymentController = require("../app/controllers/payment.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");
const logUserActivity = require("../app/middlewares/user-activity-log.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.post("/paypal/create-order", [authenticate, logUserActivity], PaymentController.createOrderPaypal);
router.post("/paypal/complete-order", [authenticate, logUserActivity], PaymentController.completeOrderPaypal);
router.post("/vnpay/create-order", [authenticate, logUserActivity], PaymentController.createOrderVnPay);
router.get("/vnpay/complete-order", PaymentController.completeOrderVnPay);
module.exports = router;
