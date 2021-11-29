const express = require("express");
const expressHandlebars = require("express-handlebars");

const middleware = require("./middleware");
const passport = require("./passport");

// Add env variables
require("dotenv").config();

const app = express();

// Add middleware
middleware(app);

// Add passport
passport(app);

// Setup handlebars view engine
app.engine(
	"handlebars",
	expressHandlebars({
		helpers: {
			json: (content) => JSON.stringify(content),
		},
	})
);
app.set("view engine", "handlebars");

app.use("/static", express.static("./public"));
app.use("/api", require("./api/router"));

app.get("/", function (req, res) {
	if (!req.isAuthenticated()) return res.redirect("/login");
	req.uest(
		{
			method: "GET",
			url: "/api/products",
		},
		(_err, _res, data) => {
			res.render("home", { title: "Home", products: data });
		}
	);
});

app.get("/login", function (req, res) {
	res.render("login", { title: "Login", message: req.user });
});
app.get("/register", function (req, res) {
	res.render("register", { title: "Register" });
});

app.listen(3000, () => console.log("Running on http://localhost:3000"));
