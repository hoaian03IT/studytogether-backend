const router = require("express").Router();
const PaymentController = require("../app/controllers/payment.controller.js");
const { authenticate } = require("../app/middlewares/authenticate.js");

// middleware that is specific to this router
const timeLog = (req, res, next) => {
	console.log("Time: ", Date.now());
	next();
};
router.use(timeLog);

router.post("/paypal/create-order", PaymentController.createOrderPaypal);
router.post("/paypal/complete-order", PaymentController.completeOrderPaypal);
module.exports = router;
