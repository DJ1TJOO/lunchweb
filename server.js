const express = require("express");
const expressHandlebars = require("express-handlebars");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const { compareSync } = require("bcrypt");
const db = require("./api/helpers/db");

// Add env variables
require("dotenv").config();

const app = express();

// Passport
const passport = require("passport");

// Give passport user id from user
passport.serializeUser(function (user, done) {
	done(null, user.id);
});

// Give passport user from user id
passport.deserializeUser(function (id, done) {
	// Select user from table and don't get password hash
	db.query("SELECT id,first_name,last_name,email,leerling_nummer,vendor FROM users WHERE id = ?", [id])
		.then(([results]) => {
			if (results.length < 1) done(new Error("Not found"), null);
			else done(null, results[0]);
		})
		.catch((err) => done(err, null));
});

// Check if user exists and check password to login and create a session
const LocalStrategy = require("passport-local").Strategy;
passport.use(
	new LocalStrategy(function (email, password, done) {
		// Select user from table and don't get password hash
		db.query("SELECT id,first_name,last_name,email,leerling_nummer,vendor,pwd FROM users WHERE email = ?", [email])
			.then(([results]) => {
				if (results.length < 1) return done(null, false, { message: "Invalid credentials" });
				const { pwd, ...user } = results[0];

				// Check if password valid else error invalid
				if (!compareSync(password, pwd)) return done(null, false, { message: "Invalid credentials" });

				// Give user without password hash
				done(null, user);
			})
			.catch((err) => done(err, null));
	})
);

app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		cookie: {
			maxAge: 1000 * 60 * 60 * 24 * 2,
		},
		resave: false,
		saveUninitialized: true,
	})
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/logout", (req, res) => {
	req.logout();
	res.redirect("/login");
});
app.post("/login", (req, res, next) => {
	passport.authenticate("local", (err, user, info) => {
		if (err) return res.send(err);

		if (!user) {
			res.render("login", { title: "Login", message: info.message });
		} else {
			req.logIn(user, (err) => {
				if (err) return res.send(err);
				res.redirect("/");
			});
		}
	})(req, res, next);
});

// Setup handlebars view engine
app.engine("handlebars", expressHandlebars());
app.set("view engine", "handlebars");

app.use("/api", require("./api/router"));

app.get("/", function (req, res) {
	if (!req.user) return res.redirect("/login");
	res.render("home", { title: "Home" });
});

app.get("/login", function (req, res) {
	res.render("login", { title: "Login", message: req.user });
});

app.listen(3000, () => console.log("Running on http://localhost:3000"));
