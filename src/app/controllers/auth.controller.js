const jwt = require("jsonwebtoken");
const { pool } = require("../../connectDB.js");
const { generateRefreshToken, generateAccessToken } = require("../../utils/generateToken.js");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const { transporter } = require("../../config/nodemailer.js");
const { validation } = require("../../utils/inputValidations.js");
const { generatePassword } = require("../../utils/passwordGenerate.js");

const imageToBlob = (imagePath) => {
    return fs.readFileSync(imagePath);
};

const generateOneYearTimestamp = () => {
    // Lấy thời gian hiện tại
    const date = new Date();

    // Thêm một năm vào thời gian hiện tại
    date.setFullYear(date.getFullYear() + 1);
    return date;
};

const hashedPassword = async (password) => {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
};

const generateTokensAndStore = async (userInfo, conn) => {
    const expiredAt = generateOneYearTimestamp(); // tạo timestamp vào 1 năm sau kể từ hôm nay
    const accessToken = generateAccessToken({ userId: userInfo["user id"], email: userInfo["email"] });
    const refreshToken = generateRefreshToken({
        userId: userInfo["user id"],
        email: userInfo["email"],
        expiresIn: expiredAt.getTime(),
    });

    // save refresh token to database
    conn.query("INSERT INTO `refresh tokens` (`user id`, token, `expired at`) VALUE (?, ?, ?);", [
        userInfo["user id"],
        refreshToken,
        expiredAt,
    ]).catch((err) => {
        throw new Error(err);
    });
    return { refreshToken, accessToken, expiredAt };
};

class Auth {
    async login(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();
            const { usernameOrEmail, password } = req.body;

            conn.query("CALL SP_GetUserAccount(?)", [usernameOrEmail])
                .then(async ([result]) => {
                    const userInfo = result[0][0];
                    const isMatchP = await bcrypt.compare(password, userInfo["hashpassword"]);
                    if (!isMatchP) {
                        res.status(401).json({ message: "Tài khoản hoặc mật khẩu không đúng." });
                        return;
                    }

                    const { accessToken, refreshToken, expiredAt } = await generateTokensAndStore(userInfo, conn);

                    const { hashpassword, "user id": id, ...rest } = { ...userInfo, token: accessToken };

                    res.status(200)
                        .cookie("token", refreshToken, {
                            expires: expiredAt,
                            httpOnly: true,
                            secure: false,
                        })
                        .json({ ...rest });
                })
                .catch((err) => {
                    res.status(401).json({ message: err.message });
                });

            pool.releaseConnection(conn);
        } catch (error) {
            res.status(401).json({ message: error.message });
        } finally {
            pool.releaseConnection(conn);
        }
    }

    async register(req, res) {
        let conn;
        try {
            const { email, password } = req.body;
            const username = email.split("@")[0];
            const hashedPassword = await hashedPassword(password);

            conn = await pool.getConnection();

            const imagePath = path.join(__dirname, "../../../public/default-avatar", "default-avatar-0.jpg");
            const defaultAvatar = imageToBlob(imagePath);

            conn.query("CALL SP_CreateUserAccount(?,?,?,?)", [email, hashedPassword, username, defaultAvatar])
                .then(async ([result]) => {
                    const userInfo = result[0][0];

                    const { accessToken, refreshToken, expiredAt } = await generateTokensAndStore(userInfo, conn);

                    const { "user id": id, ...rest } = { ...userInfo, token: accessToken }; // remove user id

                    res.status(200)
                        .cookie("token", refreshToken, {
                            expires: expiredAt,
                            httpOnly: true,
                            secure: false,
                        })
                        .json({ ...rest });
                })
                .catch((err) => {
                    if (err.sqlState === 45000 || err.sqlState === 45001) {
                        res.status(400).json({ message: err.sqlMessage });
                    } else {
                        // không show lỗi khi hoàn tất
                        res.status(400).json({ message: err.message });
                    }
                });
        } catch (error) {
            res.status(401).json({ message: error.message });
        } finally {
            pool.releaseConnection(conn);
        }
    }

    async logout(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();
            const refreshToken = req.cookies["token"];
            const { userId } = req.user;
            conn.query("DELETE FROM `refresh tokens` WHERE `user id`=? AND token=?", [userId, refreshToken])
                .then(() => {
                    res.status(200).clearCookie("token").json({ message: "Đăng xuất thành công" });
                })
                .catch((err) => {
                    res.status(400).json({ message: err.message });
                });
            pool.releaseConnection(conn);
        } catch (error) {
            res.status(401).json({ message: error.message });
        } finally {
            pool.releaseConnection(conn);
        }
    }

    async refreshToken(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();
            // lấy token từ cookies client
            const refreshToken = req.cookies["token"];

            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, userInfo) => {
                if (err) {
                    return res.status(401).json({ message: err.message });
                }

                // xoá token hiện tại
                conn.query("DELETE FROM `refresh tokens` WHERE `user id`=? AND token=?", [
                    userInfo.userID,
                    refreshToken,
                ]).catch((err) => {
                    res.status(400).json({ message: err.message });
                });

                const {
                    accessToken,
                    refreshToken: newRefreshToken,
                    expiredAt,
                } = await generateTokensAndStore(userInfo, conn);
                res.cookie("token", newRefreshToken, {
                    maxAge: expiredAt,
                    httpOnly: true,
                    secure: false,
                });
                res.status(200).json({ token: accessToken });
            });
        } catch (error) {
            res.status(401).json({ message: error.message });
        } finally {
            pool.releaseConnection(conn);
        }
    }

    async forgotPassword(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();
            const { email } = req.body;

            if (!validation.email(email)) {
                return res.status(401).json({ message: "Invalid email" });
            }

            const newPassword = generatePassword();
            const newHashedPassword = await hashedPassword(newPassword);

            conn.query("UPDATE users SET hashpassword=? WHERE email=?", [newHashedPassword, email])
                .then(() => {
                    res.status(200).json({ message: "Password reset email sent successfully" });
                })
                .catch((err) => {
                    res.status(401).json({ message: err.message });
                });

            const info = await transporter.sendMail({
                from: {
                    name: "StudyTogether😊",
                    address: process.env.NODEMAILER_USER,
                }, // sender address
                to: email, // list of receivers
                subject: "Your new password", // Subject line
                text: "Hello, guys. We are StudyTogether administrators", // plain text body
                html: `
                    <p>We have received a request to change the password for your account. Below is your new password:</p>
                    <p>Your new password: <strong style="font-size: 20px; background-color: #eee"">${newPassword}</strong> </p>
                    <p style="color: red">Please use this new password to log in to your StudyTogether account and change your password.</p>
                    <p>Your friend,</p>
                    <p><strong>StudyTogether</strong></p>
                `, // html body
            });
        } catch (error) {
            res.status(401).json({ message: error.message });
        } finally {
            pool.releaseConnection(conn);
        }
    }

    async changePassword(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();
            const { userId } = req.user;

            const { currentPassword, newPassword } = req.body;

            if (!validation.password(currentPassword) || !validation.password(newPassword)) {
                return res.status(401).json({ message: "Invalid password" });
            }

            const [result] = await conn.query("SELECT  `user id`, hashpassword FROM users WHERE `user id`=?", [userId]);

            if (result.length === 0) {
                return res.status(401).json({ message: "User doesnot exist" });
            }

            const isMatch = await bcrypt.compare(currentPassword, result[0].hashpassword);
            if (!isMatch) {
                return res.status(401).json({ message: "Your password is incorrect" });
            }

            const newHashedPassword = await hashedPassword(newPassword);
            await conn.query("UPDATE users SET hashpassword=? WHERE `user id`=?", [newHashedPassword, userId]);

            res.status(200).json({ message: "Password changed successfully" });
        } catch (error) {
            res.status(401).json({ message: error.message });
        } finally {
            pool.releaseConnection(conn);
        }
    }
}

module.exports = new Auth();
