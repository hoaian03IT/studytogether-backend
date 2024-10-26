const jwt = require("jsonwebtoken");
const {pool} = require("../../connectDB.js");
const {generateRefreshToken, generateAccessToken} = require("../../utils/generateToken.js");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const saltRounds = 10;

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

const generateTokensAndStore = async (userInfo, conn) => {
    const expiredAt = generateOneYearTimestamp(); // tạo timestamp vào 1 năm sau kể từ hôm nay
    const accessToken = generateAccessToken({userId: userInfo["user id"], email: userInfo["email"]});
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
    return {refreshToken, accessToken, expiredAt};
};

class Auth {
    async login(req, res) {
        try {
            const conn = await pool.getConnection();
            const {usernameOrEmail, password} = req.body;

            conn.query("CALL SP_GetUserAccount(?)", [usernameOrEmail])
                .then(async ([result]) => {
                    const userInfo = result[0][0];
                    const isMatchP = await bcrypt.compare(password, userInfo["hashpassword"]);
                    if (!isMatchP) {
                        res.status(401).json({message: "Tài khoản hoặc mật khẩu không đúng."});
                        return;
                    }

                    const {accessToken, refreshToken, expiredAt} = await generateTokensAndStore(userInfo, conn);

                    const {hashpassword, "user id": id, ...rest} = {...userInfo, token: accessToken};

                    res.status(200)
                        .cookie("refresh-token", refreshToken, {
                            expires: expiredAt,
                            httpOnly: true,
                            secure: false,
                        })
                        .json({...rest});
                })
                .catch((err) => {
                    res.status(401).json({message: err.message});
                });

            pool.releaseConnection(conn);
        } catch (error) {
            res.status(401).json({message: error.message});
        }
    }

    async register(req, res) {
        try {
            const {email, password} = req.body;
            const username = email.split("@")[0];
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const conn = await pool.getConnection();

            const imagePath = path.join(__dirname, "../../../public/default-avatar", "default-avatar-0.jpg");
            const defaultAvatar = imageToBlob(imagePath);

            conn.query("CALL SP_CreateUserAccount(?,?,?,?)", [email, hashedPassword, username, defaultAvatar])
                .then(async ([result]) => {
                    const userInfo = result[0][0];

                    const {accessToken, refreshToken, expiredAt} = await generateTokensAndStore(userInfo, conn);

                    const {"user id": id, ...rest} = {...userInfo, token: accessToken}; // remove user id

                    res.status(200)
                        .cookie("refresh-token", refreshToken, {
                            expires: expiredAt,
                            httpOnly: true,
                            secure: false,
                        })
                        .json({...rest});
                })
                .catch((err) => {
                    if (err.sqlState === 45000 || err.sqlState === 45001) {
                        res.status(400).json({message: err.sqlMessage});
                    } else {
                        // không show lỗi khi hoàn tất
                        res.status(400).json({message: err.message});
                    }
                });
            pool.releaseConnection(conn);
        } catch (error) {
            res.status(401).json({message: error.message});
        }
    }

    async logout(req, res) {
        try {
            const conn = await pool.getConnection();
            const refreshToken = req.cookies["refresh-token"];
            const {userId} = req.user;
            conn.query("DELETE FROM `refresh tokens` WHERE `user id`=? AND token=?", [userId, refreshToken])
                .then(() => {
                    res.status(200).clearCookie("refresh-token").json({message: "Đăng xuất thành công"});
                })
                .catch((err) => {
                    res.status(400).json({message: err.message});
                });
            pool.releaseConnection(conn);
        } catch (error) {
            res.status(401).json({message: error.message});
        }
    }

    async refreshToken(req, res) {
        let conn;
        try {
            conn = await pool.getConnection();
            // lấy token từ cookies client
            const refreshToken = req.cookies["refresh-token"];

            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, userInfo) => {
                if (err) {
                    return res.status(401).json({message: err.message});
                }

                // kiểm tra token có trong database không
                conn.query("SELECT 1 FROM `refresh tokens` WHERE `user id`=? AND token=?", [userInfo['user id'], refreshToken])
                    .then(response => {
                        if (response[0].length === 0) {
                            return res.status(401).json({messageCode: 'UNAUTHORIZED'});
                        }
                        // xoá token hiện tại
                        conn.query("DELETE FROM `refresh tokens` WHERE `user id`=? AND token=?", [userInfo['user id'], refreshToken])
                            .then(async (response) => {
                                console.log(response)
                                const {
                                    accessToken,
                                    refreshToken: newRefreshToken,
                                    expiredAt,
                                } = await generateTokensAndStore(userInfo, conn);
                                res.cookie("refresh-token", newRefreshToken, {
                                    maxAge: expiredAt,
                                    httpOnly: true,
                                    secure: false,
                                });
                                res.status(200).json({token: accessToken});
                            })
                            .catch((err) => {
                                res.status(400).json({message: err.message});
                            });
                    })
                    .catch((err) => {
                        return res.status(400).json({message: err.message});
                    });

            });
        } catch (error) {
            res.status(500).json({message: error.message});
        } finally {
            pool.releaseConnection(conn);
        }
    }
}

module.exports = new Auth();
