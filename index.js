const express = require("express");
require("dotenv").config();
const route = require("./src/routes");
const { getConnection } = require("./src/connectDB");
const bodyParser = require('body-parser');
const cors = require('cors');

// create models
const user = require('./src/app/models/user');

const app = express();
const port = 3000;

app.use(bodyParser.json())
app.use(cors());
route(app);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);

  // Check DB connection
  getConnection();
});
