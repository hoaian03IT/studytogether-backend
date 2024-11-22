const express = require("express");
require("dotenv").config();
const route = require("./src/routes");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
require("./src/config/cloudinary");
const compression = require("compression");

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

// parse request
app.use(bodyParser.urlencoded({ extended: true, limit: "20mb" }));
app.use(bodyParser.json({ limit: "20mb" }));

// parse cookies
app.use(cookieParser());

// cho phép get ip address nếu như sử dụng proxy
app.set("trust proxy", true);

// static files: 'base_url/static/...'
app.use("/static", express.static(path.join(__dirname, "public")));

// log apis called
app.use(morgan(":method :url :status :response-time ms - :res[content-length]"));

// compress all responses
app.use(compression());

// config route
route(app);

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
