const authRoute = require("./auth.route.js");
const courseRoute = require("./course.route.js");

function route(app) {
    app.use("/auth", authRoute);
    app.use("/course", courseRoute);
}

module.exports = route;
