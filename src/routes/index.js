const authRoute = require("./auth.route.js");
const courseRoute = require("./course.route.js");
const roleRoute = require("./role.route.js");
const vocabularyRoute = require("./vocabulary.route.js");
const levelRoute = require("./level.route.js");
const exampleRoute = require("./example.route.js");

function route(app) {
    app.use("/auth", authRoute);
    app.use("/course", courseRoute);
    app.use("/role", roleRoute);
    app.use("/vocabulary", vocabularyRoute);
    app.use("/level", levelRoute);
    app.use("/example", exampleRoute);
}

module.exports = route;
