const authRoute = require("./auth.route.js");
const courseRoute = require("./course.route.js");
const roleRoute = require("./role.route.js");
const vocabularyRoute = require("./vocabulary.router.js");

function route(app) {
    app.use("/auth", authRoute);
    app.use("/course", courseRoute);
    app.use("/role", roleRoute);
    app.use("/vocabulary", vocabularyRoute);
}

module.exports = route;
