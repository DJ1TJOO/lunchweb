const passport = require("passport");
const { compareSync } = require("bcrypt");

const db = require("./api/helpers/db");
const { toCamel } = require("./api/helpers/utils");

module.exports = (app) => {
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
				else done(null, toCamel(results[0]));
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
					done(null, toCamel(user));
				})
				.catch((err) => done(err, null));
		})
	);

	// Add passport middleware
	app.use(passport.initialize());
	app.use(passport.session());

	// Setup login and logout
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
};
