const express = require("express");
require("dotenv").config();
const route = require("./src/routes");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");

const app = express();
const port = process.env.SERVER_POST || 4000;
const client_url = process.env.CLIENT_URL;

const corsOptions = {
	credentials: true,
	origin: client_url,
	methods: ["GET", "PUT", "POST", "DELETE"],
	// allowedHeaders: "Content-Type,Authorization",
	optionsSuccessStatus: 200,
	preflightContinue: false,
};
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true, limit: "20mb" }));
app.use(bodyParser.json({ limit: "20mb" }));
app.use(cookieParser());

// static files: '/static/...'
app.use("/static", express.static(path.join(__dirname, "public")));

app.use(morgan(":method :url :status :response-time ms - :res[content-length]"));

// config route
route(app);

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
