const { get_access_token, endpoint_url } = require("../../payments/paypal/get-access-token");
const { pool } = require("../../connectDB");

class PaymentController {
	async createOrderPaypal(req, res) {
		let conn;
		try {
			conn = pool.getConnection();
			let { courseId, currentCode, intent } = req.body;
			let access_token = await get_access_token();
			if (access_token) {
				let responsePrice = await conn.query("CALL SP_GetCoursePrice(?)", [courseId]);
				let { price, discount } = responsePrice[0][0][0];
				let realPrice = price * (1 - discount) >= 0 ? price * (1 - discount) : 0;
				let order_data_json = {
					"intent": intent.toUpperCase(),
					"purchase_units": [{
						"amount": {
							"currency_code": currentCode,
							"value": realPrice,
						},
					}],
				};
				const data = JSON.stringify(order_data_json);

				fetch(endpoint_url + "/v2/checkout/orders", { //https://developer.paypal.com/docs/api/orders/v2/#orders_create
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${access_token}`,
					},
					body: data,
				})
					.then(res => res.json())
					.then(json => {
						res.status(200).json(json);
					}); //Send minimal data to client
			}
		} catch (error) {
			console.error(error);
			res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async completeOrderPaypal(req, res) {
		let conn;
		try {
			conn = pool.getConnection();
			const { order_id, intent, courseId } = req.body;
			const { "user id": userId } = req.user;

			let access_token = await get_access_token();
			if (access_token) {
				fetch(endpoint_url + "/v2/checkout/orders/" + order_id + "/" + intent, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${access_token}`,
					},
				})
					.then(res => res.json())
					.then(async json => {
						const responseCreateEnrollment = await conn.query("CALL SP_CreateEnrollment(?,?)", [courseId, userId]);
						const enrollmentId = responseCreateEnrollment[0][0][0]?.["enrollment id"];
						const { currency_code, value } = json.purchase_units[0]?.payments?.captures[0].amount;
						await conn.query("CALL SP_CreateTransaction(?,?,?,?,?)", [enrollmentId, value, currency_code, "paypal", json?.id]);
						res.status(200).json(json);
					}); //Send minimal data to client
			}
		} catch (error) {
			console.error(error);
			res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
		} finally {
			pool.releaseConnection(conn);
		}
	}
}

module.exports = new PaymentController();