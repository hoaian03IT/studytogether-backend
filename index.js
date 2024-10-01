const express = require("express");

const app = express();
const port = 3000;

const { pool } = require("./src/connectDB.js");

app.get("/", async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const [results, field] = await conn.query("call sp_test('1')");
        pool.releaseConnection(conn);
        res.send({ results, field });
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
