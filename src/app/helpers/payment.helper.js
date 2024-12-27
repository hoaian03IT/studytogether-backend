const axios = require("axios");

class PaymentHelper {
	static async paymentAllocation(balance, currency) {
		let value = balance;
		if (currency !== "USD") {
			let { data } = await axios.get(process.env.EXCHANGE_RATE_API);
			let DollarPerVND = data?.["conversion_rates"]?.["VND"];
			value = Number((value / DollarPerVND).toFixed(2)); // convert to Dollar
		}

		const commissionRate = process.env.COMMISSION_RATE;

		const retentionMoney = Number((value * (1 - commissionRate)).toFixed(2));
		const commissionMoney = value - retentionMoney;

		return { commissionRate, retentionMoney, commissionMoney };
	}
}

module.exports = { PaymentHelper };
