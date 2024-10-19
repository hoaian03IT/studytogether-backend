const jwt = require("jsonwebtoken");

function generateAccessToken({ userId, email }) {
    return jwt.sign({ userId: userId, email: email }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: 1000 * 60,
    });
}

function generateRefreshToken({ userId, email, expiresIn }) {
    return jwt.sign({ userId: userId, email: email }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: expiresIn,
    });
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
};
