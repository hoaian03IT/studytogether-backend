import {
	ApiError,
	Client,
	Environment,
	LogLevel,
	OrdersController,
	PaymentsController,
} from "@paypal/paypal-server-sdk";

const client = new Client({
	clientCredentialsAuthCredentials: {
		oAuthClientId: process.env.PAYPAL_CLIENT_ID,
		oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
	},
	timeout: 0,
	environment: Environment.Sandbox,
	logging: {
		logLevel: LogLevel.Info,
		logRequest: { logBody: true },
		logResponse: { logHeaders: true },
	},
});

const ordersController = new OrdersController(client);
const paymentsController = new PaymentsController(client);

const createOrder = async (amount, unit = "USD") => {
	const collect = {
		body: {
			intent: "CAPTURE",
			purchaseUnits: [
				{
					amount: {
						currencyCode: unit,
						value: amount.toString(),
					},
				},
			],
		},
		prefer: "return=minimal",
	};

	try {
		const { body, ...httpResponse } = await ordersController.ordersCreate(
			collect,
		);
		// Get more response info...
		// const { statusCode, headers } = httpResponse;
		return {
			jsonResponse: JSON.parse(body),
			httpStatusCode: httpResponse.statusCode,
		};
	} catch (error) {
		if (error instanceof ApiError) {
			// const { statusCode, headers } = error;
			throw new Error(error.message);
		}
	}
};

module.exports = { createOrder };
