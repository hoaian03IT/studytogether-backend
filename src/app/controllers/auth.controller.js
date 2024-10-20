const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../../connectDB.js");
const { generateRefreshToken, generateAccessToken } = require("../../utils/generateToken.js");
const bcrypt = require("bcrypt");
const path = require("path");
const { transporter } = require("../../config/nodemailer.js");
const { validation } = require("../../utils/inputValidations.js");
const { generatePassword } = require("../../utils/passwordGenerate.js");
const imageToBlob = require("../../utils/imageToBlob.js");
const { OAuth2Client } = require("google-auth-library");
const { google } = require("googleapis");

const clientId = process.env.GG_CLIENT_ID;
const client = new OAuth2Client(clientId, process.env.GG_CLIENT_SECRET);

const generateOneYearTimestamp = () => {
    // Lấy thời gian hiện tại
    const date = new Date();

    // Thêm một năm vào thời gian hiện tại
    date.setFullYear(date.getFullYear() + 1);
    return date;
};

const convertHashedPassword = async (password) => {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
};

// Helper function to create a simple hash (MD5-like) from a string

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

const generateUsername = (email) => {
    const hash = crypto.createHash("md5").update(email).digest("hex").slice(0, 6); // Take first 6 characters of the hash
    let username = `${email.split("@")[0]}_${hash}`;
    return username;
};

const verifyToken = async (credentials) => {
    const ticket = await client.verifyIdToken({
        idToken: credentials,
        audience: clientId,
    });

    return ticket.getPayload();
};

class Auth {
    async login(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();
            const { usernameOrEmail, password } = req.body;

            if (!validation.email(usernameOrEmail) && !validation.username(usernameOrEmail)) {
                return res.status(401).json({ message: "Invalid account." });
            }

            if (!validation.password(password)) {
                return res.status(401).json({ message: "Invalid password." });
            }

            conn.query("CALL SP_GetUserAccount(?)", [usernameOrEmail])
                .then(async ([result]) => {
                    const userInfo = result[0][0];
                    const isMatchP = await bcrypt.compare(password, userInfo["hashpassword"]);
                    if (!isMatchP) {
                        res.status(401).json({ message: "Incorrect account or password." });
                        return;
                    }

                    const { accessToken, refreshToken, expiredAt } = await generateTokensAndStore(userInfo, conn);

                    const { hashpassword, "user id": id, ...rest } = userInfo;

                    res.cookie("access_token", accessToken, {
                        httpOnly: true,
                        secure: true,
                        maxAge: 60 * 1000,
                    });

                    res.cookie("refresh_token", refreshToken, {
                        maxAge: 1000 * 60 * 60 * 24 * 365,
                        expires: expiredAt,
                        httpOnly: true,
                        secure: true,
                    });

                    res.status(200).json({ ...rest });
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
            const { email, password, role } = req.body;

            if (!validation.email(email)) {
                return res.status(401).json({ message: "Invalid email" });
            }

            if (!validation.password(password)) {
                return res.status(401).json({ message: "Invalid password" });
            }

            let username = email.split("@")[0];
            const hashedPassword = await convertHashedPassword(password);

            conn = await pool.getConnection();

            let [records] = await conn.query(
                "SELECT `user id` FROM users WHERE username=? ORDER BY `user id` LIMIT 1",
                [username]
            );

            if (records.length > 0) {
                username = generateUsername(email);
            }

            const imagePath = path.join(__dirname, "../../../public/default-avatar", "default-avatar-0.jpg");
            const defaultAvatar = imageToBlob(imagePath);

            conn.query("CALL SP_CreateUserAccount(?,?,?,?,?,?,?,?)", [
                email,
                hashedPassword,
                username,
                defaultAvatar,
                role,
                null,
                null,
                null,
            ])
                .then(async ([response]) => {
                    const userInfo = response[0][0];

                    const { accessToken, refreshToken, expiredAt } = await generateTokensAndStore(userInfo, conn);

                    const { "user id": id, ...rest } = userInfo; // remove user id

                    res.cookie("access_token", accessToken, {
                        httpOnly: true,
                        secure: true,
                        maxAge: 60 * 1000,
                    });

                    res.cookie("refresh_token", refreshToken, {
                        maxAge: 1000 * 60 * 60 * 24 * 365,
                        expires: expiredAt,
                        httpOnly: true,
                        secure: true,
                    });

                    res.status(200).json({ ...rest });
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
                    // clear cookie từ client
                    res.clearCookie("refresh_token");
                    res.clearCookie("access_token");

                    res.status(200).json({ message: "Đăng xuất thành công" });
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
            let { email } = req.body;
            email = email.trim();

            if (!validation.email(email)) {
                return res.status(401).json({ message: "Invalid email" });
            }

            const newPassword = generatePassword();
            const newHashedPassword = await convertHashedPassword(newPassword);

            conn.query("CALL SP_GetNewPassword(?, ?)", [newHashedPassword, email])
                .then(async (response) => {
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
                    res.status(200).json({ message: response[0][0][0].message });
                })
                .catch((err) => {
                    res.status(401).json({ message: err.message });
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
                return res.status(401).json({ message: "User does not exist" });
            }

            const isMatch = await bcrypt.compare(currentPassword, result[0].hashpassword);
            if (!isMatch) {
                return res.status(401).json({ message: "Your password is incorrect" });
            }

            const newHashedPassword = await convertHashedPassword(newPassword);
            await conn.query("UPDATE users SET hashpassword=? WHERE `user id`=?", [newHashedPassword, userId]);

            res.status(200).json({ message: "Password changed successfully" });
        } catch (error) {
            res.status(401).json({ message: error.message });
        } finally {
            pool.releaseConnection(conn);
        }
    }

    async googleLogin(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();

            const { token, role } = req.body;
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: token });

            const oauth2 = google.oauth2({
                auth: oauth2Client,
                version: "v2",
            });

            const { data } = await oauth2.userinfo.get();

            const { email, given_name, family_name, picture, id: sub } = data;

            // check nếu đã có tài khoản...
            conn.query("CALL SP_GetUserAccountByGoogleId(?,?)", [email, sub])
                .then(async ([response]) => {
                    const userInfo = response[0][0];
                    const { accessToken, refreshToken, expiredAt } = await generateTokensAndStore(userInfo, conn);

                    const { "user id": id, ...rest } = userInfo; // remove user id

                    res.cookie("access_token", accessToken, {
                        httpOnly: true,
                        secure: true,
                        maxAge: 60 * 1000,
                    });

                    res.cookie("refresh_token", refreshToken, {
                        maxAge: 1000 * 60 * 60 * 24 * 365,
                        expires: expiredAt,
                        httpOnly: true,
                        secure: true,
                    });

                    res.status(200).json({ ...rest, message: "login" });
                })
                .catch(async (err) => {
                    if (err.sqlCode !== 45000) return res.status(401).json({ message: err.message });
                    Ư;
                    // trường hợp procedure báo lỗi không có tài khoản thì tạo
                    let username = email.split("@")[0];

                    let [records] = await conn.query(
                        "SELECT 1 FROM users WHERE username=? ORDER BY `user id` LIMIT 1",
                        [username]
                    );

                    if (records.length > 0) {
                        username = generateUsername(email);
                    }

                    const hashedPassword = await convertHashedPassword(sub);
                    conn.query("CALL SP_CreateUserAccount(?,?,?,?,?,?,?,?)", [
                        email,
                        hashedPassword,
                        username,
                        picture,
                        role,
                        sub,
                        given_name,
                        family_name,
                    ])
                        .then(async ([response]) => {
                            const userInfo = response[0][0];

                            const { accessToken, refreshToken, expiredAt } = await generateTokensAndStore(
                                userInfo,
                                conn
                            );

                            const { "user id": id, ...rest } = userInfo; // remove user id

                            res.cookie("access_token", accessToken, {
                                httpOnly: true,
                                secure: true,
                                maxAge: 60 * 1000,
                            });

                            res.cookie("refresh_token", refreshToken, {
                                maxAge: 1000 * 60 * 60 * 24 * 365,
                                expires: expiredAt,
                                httpOnly: true,
                                secure: true,
                            });

                            res.status(200).json({ ...rest, message: "register" });
                        })
                        .catch((err) => {
                            if (err.sqlState === 45000 || err.sqlState === 45001) {
                                res.status(400).json({ message: err.sqlMessage });
                            } else {
                                // không show lỗi khi hoàn tất
                                res.status(400).json({ message: err.message });
                            }
                        });
                });
        } catch (error) {
            res.status(403).json(error.message);
        } finally {
            pool.releaseConnection(conn);
        }
    }
}

module.exports = new Auth();
