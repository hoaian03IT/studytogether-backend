const { get_access_token, endpoint_url } = require("../../payments/paypal/get-access-token");
const { pool } = require("../../connectDB");
const { vnpay } = require("../../payments/vnpay/config");
const { dateFormat, ProductCode, VnpLocale, VerifyReturnUrl } = require("vnpay");
const axios = require("axios");

async function getCoursePrices(connection, courseId) {
	let responsePrice = await connection.query("CALL SP_GetCoursePrice(?)", [courseId]);
	let { price, discount } = responsePrice[0][0][0];
	let handledPrice = price * (1 - discount) >= 0 ? price * (1 - discount) : 0;

	return { handledPrice, discount };
}

class PaymentController {
	async createOrderPaypal(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			let { "user id": userId } = req.user;
			let { courseId, currentCode, intent } = req.body;

			const enrollmentInfo = await conn.query("CALL SP_GetEnrollmentInfo(?,?)", [courseId, userId]);

			if (enrollmentInfo[0][0]?.length > 0) {
				return res.status(406).json({ errorCode: "COURSE_ENROLLED" });
			}

			const percentageFee = 0.029; // 2.9% PayPal fee
			let access_token = await get_access_token();
			if (access_token) {
				let { handledPrice } = await getCoursePrices(conn, courseId);
				handledPrice = handledPrice + handledPrice * percentageFee;

				let order_data_json = {
					intent: intent.toUpperCase(),
					purchase_units: [
						{
							amount: {
								currency_code: currentCode,
								value: handledPrice.toFixed(2),
							},
						},
					],
				};

				const data = JSON.stringify(order_data_json);

				fetch(endpoint_url + "/v2/checkout/orders", {
					//https://developer.paypal.com/docs/api/orders/v2/#orders_create
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${access_token}`,
					},
					body: data,
				})
					.then((res) => res.json())
					.then((json) => {
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
			conn = await pool.getConnection();
			const { orderId, intent, courseId } = req.body;
			const { "user id": userId } = req.user;

			let access_token = await get_access_token();
			if (access_token) {
				fetch(endpoint_url + "/v2/checkout/orders/" + orderId + "/" + intent, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${access_token}`,
					},
				})
					.then((res) => res.json())
					.then(async (json) => {
						const { currency_code, value } = json.purchase_units[0]?.payments?.captures[0].amount;
						await conn.query("CALL SP_CreateTransaction(?,?,?,?,?,?)", [userId, courseId, value, currency_code, "paypal", json?.id]);
						await conn.query("CALL SP_CreateEnrollment(?,?)", [courseId, userId]);
						res.status(200).json({ verify: json, messageCode: "PAYMENT_SUCCESS" });
					}); //Send minimal data to client
			}
		} catch (error) {
			console.error(error);
			if (error.sqlState == 45001) res.status(406).json({ errorCode: "COURSE_ENROLLED" });
			else res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async createOrderVnPay(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			let { "user id": userId } = req.user;
			let { paymentContent, courseId, language = "VN" } = req.body;

			const enrollmentInfo = await conn.query("CALL SP_GetEnrollmentInfo(?,?)", [courseId, userId]);

			if (enrollmentInfo[0][0]?.length > 0) {
				return res.status(406).json({ errorCode: "COURSE_ENROLLED" });
			}

			let { handledPrice: USDPrice } = await getCoursePrices(conn, courseId);
			// convert USD to VND real-time
			let { data } = await axios.get(process.env.EXCHANGE_RATE_API);
			let VNDPerDollar = data?.["conversion_rates"]?.["VND"];
			let handledVNDPrice = VNDPerDollar * USDPrice;
			// ===========
			
			const expire = new Date();
			expire.setTime(expire.getTime() + 1000 * 60 * 10); // 10 mins

			const clientIpAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.ip;

			const vnpUrl = vnpay.buildPaymentUrl(
				{
					vnp_Amount: handledVNDPrice.toFixed(2),
					vnp_IpAddr: clientIpAddr,
					vnp_TxnRef: new Date().getTime().toString(),
					vnp_OrderInfo: paymentContent,
					vnp_OrderType: ProductCode.Pay,
					vnp_ReturnUrl: `${process.env.SERVER_URL}/payment/vnpay/complete-order?user_id=${userId}&course_id=${courseId}`,
					vnp_Locale: VnpLocale[language.toUpperCase()], // 'vn' hoặc 'en'
					vnp_CreateDate: dateFormat(new Date()), // tùy chọn, mặc định là hiện tại
					vnp_ExpireDate: dateFormat(expire), // tùy chọn
				},
				{
					withHash: true,
				},
			);

			res.status(200).json({ vnpUrl });
		} catch (error) {
			console.error(error);
			res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
		} finally {
			pool.releaseConnection(conn);
		}
	}

	async completeOrderVnPay(req, res) {
		let conn;
		try {
			conn = await pool.getConnection();
			const { user_id: userId, course_id: courseId } = req.query;
			const verify = vnpay.verifyReturnUrl(req.query);

			if (!verify.isSuccess) {
				return res.status(400).json({ errorCode: "PAYMENT_FAILED" });
			}
			let currencyCode = "VND",
				value = verify?.["vnp_Amount"],
				orderId = `${verify?.["vnp_TxnRef"]}-${verify?.["vnp_TransactionNo"]}`;
			await conn.query("CALL SP_CreateTransaction(?,?,?,?,?,?)", [userId, courseId, value, currencyCode, "vnpay", orderId]);
			await conn.query("CALL SP_CreateEnrollment(?,?)", [courseId, userId]);
			res.status(200).send("Thanh toán thành công! (Payment successfully)");
		} catch (error) {
			console.error(error);
			res.status(500).json({ errorCode: "INTERNAL_SERVER_ERROR" });
		} finally {
			pool.releaseConnection(conn);
		}
	}
}

module.exports = new PaymentController();
