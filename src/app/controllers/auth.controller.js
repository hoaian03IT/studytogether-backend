const jwt = require("jsonwebtoken");
const { pool } = require("../../connectDB.js");
const { generateRefreshToken } = require("../../utils/generateToken.js");

class Auth {
    async login(req, res) {}

    async register(req, res) {}

    async logout(req, res) {}

    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies["refresh-token"];

            let userId;
            // lấy id từ token
            try {
                const r = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                userId = r.userId;
            } catch (err) {
                userId = null;
                res.status(401).json({ message: "Unauthorized 4" });
            }

            const conn = await pool.getConnection();
            // xoá token hiện tại
            let [r] = await conn.query(`delete from users where \`user id\`=${userId} and token=${refreshToken}`);
            if (r.affectedRows === 0) {
                return res.status(401).json({ message: "Token không hợp lệ" });
            }

            [r] = await conn.query(`select \`user id\`, email from users where \`user id\`=${userId}`);

            const userInfo = { userId, email: r[0]["email"] };
            const newRefreshToken = generateRefreshToken(userInfo);
            const accessToken = generateAccessToken(userInfo);
            await conn.query(`call SP_InsertNewToken(${userId}, '${newRefreshToken}', '123')`);
            res.cookie("refresh-token", newRefreshToken, {
                maxAge: 1000 * 60 * 60 * 24 * 30,
                httpOnly: true,
                secure: true,
            });
            res.status(200).json({ token: accessToken });
        } catch (error) {
            return res.status(401).json({ message: error.message });
        }
    }
}

module.exports = new Auth();
