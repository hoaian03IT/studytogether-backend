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
const { createServer } = require("http");
const { Server } = require("socket.io");
const { pool } = require("./src/connectDB");
const { NotificationController } = require("./src/app/controllers/notification.controller");
const { ReminderController } = require("./src/app/controllers/reminder.controller");

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

// instance reminder controller
new ReminderController({
	batchSize: 100,
});

app.listen(port, () => {
	console.log(`The system listening on port ${port}`);
});


// socket handler
const httpServer = createServer(app);
const socketIo = new Server(httpServer, {
	cors: {
		origin: "*",
	},
});

const userSockets = new Map();

socketIo.on("connection", (socket) => { ///Handle khi có connect từ client tới
	const count = socketIo.engine.clientsCount;
	socket.emit("online-users", { onlineUser: count });

	// luu username cua user so voi id socket
	socket.on("register", ({ username }) => {
		userSockets.set(username, socket.id);
		console.log(`Registered user: ${username} with socket ID: ${socket.id}`);
		console.log("Current userSockets:", [...userSockets.entries()]);
	});

	socket.on("course-enrollment", async ({ enrollmentId }) => {
		const {
			notificationId,
			ownerUsername,
		} = await NotificationController.createNotificationCourseRegistration(enrollmentId);

		let socketId = userSockets.get(ownerUsername);

		if (userSockets.get(ownerUsername)) {
			socket.to(socketId).emit("receive-notification", notificationId);
		}
	});

	socket.on("disconnect", () => {
		console.log("Client disconnected"); // Khi client disconnect thì log ra terminal.
		for (const [username, socketId] of userSockets.entries()) {
			if (socketId === socket.id) {
				userSockets.delete(username);
				console.log(`User disconnected: ${username}`);
				break;
			}
		}
	});
});

httpServer.listen(3000, () => {
	console.log("Socket server listening on port 3000");
});
