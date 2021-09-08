const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const uest = require("uest");

module.exports = (app) => {
	// Add cookie parser
	app.use(cookieParser(process.env.SESSION_SECRET));

	// Add body parsers
	app.use(express.urlencoded({ extended: true }));
	app.use(express.json());

	// Add sessions
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

	// Add support for internal requests
	app.use(uest());
};
