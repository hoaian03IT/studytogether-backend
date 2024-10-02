const jwt = require("jsonwebtoken");

function generateAccessToken(userInfo) {
    console.log(process.env.ACCESS_TOKEN_SECRET);
    return jwt.sign({ userId: userInfo["user id"], email: userInfo["email"] }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: 60,
    });
}

function generateRefreshToken(userInfo) {
    return jwt.sign({ userId: userInfo["user id"], email: userInfo["email"] }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "30d",
    });
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
};
