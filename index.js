const express = require("express");
require("dotenv").config();
const route = require("./src/routes");

const app = express();
const port = 3000;

route(app);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);

  // Check DB connection
  getConnection();
});
