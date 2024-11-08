const express = require("express");
require("dotenv").config();
const route = require("./src/routes");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const cloudinary = require("cloudinary");

cloudinary.v2.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_SECRET_KEY,
	secure: true,
});

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
app.set("trust proxy", true); // cho phép get ip address nếu như sử dụng proxy

// static files: '/static/...'
app.use("/static", express.static(path.join(__dirname, "public")));

app.use(morgan(":method :url :status :response-time ms - :res[content-length]"));

// config route
route(app);

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
