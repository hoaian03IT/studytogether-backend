const environment = process.env.ENVIRONMENT || "sandbox";
const endpoint_url = environment === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
const client_id = process.env.PAYPAL_CLIENT_ID;
const client_secret = process.env.PAYPAL_CLIENT_SECRET;

function get_access_token() {
	const auth = `${client_id}:${client_secret}`;
	const data = "grant_type=client_credentials";
	return fetch(endpoint_url + "/v1/oauth2/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"Authorization": `Basic ${Buffer.from(auth).toString("base64")}`,
		},
		body: data,
	})
		.then(res => res.json())
		.then(json => {
			return json.access_token;
		});
}

module.exports = { get_access_token, endpoint_url };