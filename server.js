const express = require("express");
const expressHandlebars = require("express-handlebars");

const middleware = require("./middleware");

// Add env variables
require("dotenv").config();

const app = express();

// Add middleware
middleware(app);

// Setup handlebars view engine
app.engine("handlebars", expressHandlebars());
app.set("view engine", "handlebars");

app.use("/api", require("./api/router"));

app.get("/", function (req, res) {
	if (!req.isAuthenticated()) return res.redirect("/login");
	res.render("home", { title: "Home" });
});

app.get("/login", function (req, res) {
	res.render("login", { title: "Login", message: req.user });
});
app.get("/register", function (req, res) {
	res.render("register", { title: "Register" });
});

app.listen(3000, () => console.log("Running on http://localhost:3000"));
