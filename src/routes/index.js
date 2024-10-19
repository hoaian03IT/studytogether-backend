const authRoute = require("./auth.route.js");
const courseRoute = require("./course.route.js");
const roleRoute = require("./role.route.js");

function route(app) {
    app.use("/auth", authRoute);
    app.use("/course", courseRoute);
    app.use("/role", roleRoute);
}

module.exports = route;
