const mysql = require("mysql2/promise");
const Sequelize = require("sequelize");

const DB = "study_together";
const DATABASE_USERNAME = "root";
const DATABASE_PASSWORD = "khangdo@2202";
const HOST = "localhost";

const sequelize = new Sequelize(DB, DATABASE_USERNAME, DATABASE_PASSWORD, {
  host: HOST,
  dialect: "mysql",
});

// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool({
  host: HOST,
  user: DATABASE_USERNAME,
  database: DB,
  password: DATABASE_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Use the pool to get a connection
async function getConnection() {
  try {
    sequelize
      .authenticate()
      .then(() => {
        console.log("Connection has been established successfully.");
      })
      .catch((error) => {
        console.error("Unable to connect to the database: ", error);
      });
  } catch (err) {
    console.error("Error connecting to the database:", err);
    throw err;
  }
}

// Example usage:
async function queryDatabase() {
  const conn = await getConnection();
  try {
    const [rows, fields] = await conn.execute("SELECT * FROM users");
    console.log("Results:", rows);
  } catch (err) {
    console.error("Error querying the database:", err);
  } finally {
    conn.release(); // Release the connection back to the pool
  }
}

module.exports = { pool, sequelize, getConnection, queryDatabase };
