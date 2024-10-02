const authRoute = require("./auth.route.js");

function route(app) {
    app.use("/auth", authRoute);
}

module.exports = route;
