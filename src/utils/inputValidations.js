validation = {};

validation.email = (email) => {
	const emailRegex = /^(?=.{1,254}$)[a-zA-Z0-9._]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	return emailRegex.test(email);
};

validation.username = (username) => {
	const usernameRegex = /^[a-zA-Z0-9_-]{3,16}$/;
	return usernameRegex.test(username);
};

validation.password = (password) => {
	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,68}$/;
	return passwordRegex.test(password);
};

validation.url = (value) => {
	const urlRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+)(\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=%-]*)?$/;
	return urlRegex.test(value);
};

module.exports = { validation };
