const db = require("./helpers/db");
const { toCamel, checkEmpty, objectToResponse } = require("./helpers/utils");

const { Router } = require("express");
const router = Router();

router.get("/:id", (req, res) => {
	// Not loggedin return 401
	if (!req.isAuthenticated()) {
		return res.status(401).send({
			success: false,
			error: "unauthorized",
		});
	}

	// Users can only get there own account unless vendor
	if (req.params.id !== req.user.id && !req.user.vendor) {
		return res.status(403).send({
			success: false,
			error: "forbidden",
		});
	}

	// Select user from db without pwd
	db.query("SELECT id,first_name,last_name,email,leerling_nummer,vendor FROM users WHERE id=?", [req.params.id])
		.then(([results]) => {
			if (results.length < 1) {
				// No results thus not found
				res.status(404).send({
					success: false,
					error: "not-found",
				});
			} else {
				// Send user as data
				res.send({
					success: true,
					data: toCamel(results[0]),
				});
			}
		})
		.catch((error) => {
			// Mysql error
			res.status(500).send({
				success: false,
				error: "mysql",
			});
		});
});

router.post("/", async (req, res) => {
	// Not loggedin return 401
	if (!req.isAuthenticated()) {
		return res.status(401).send({
			success: false,
			error: "unauthorized",
		});
	}

	// Destructure body
	const { firstName, lastName, email, leerlingNummer, password } = req.body;

	// Check empties
	const empty = checkEmpty(["firstName", "lastName", "email", "password"], req.body);
	if (empty) return objectToResponse(res, empty);

	// Firstname too short
	if (firstName.length < 5) {
		return res.status(422).send({
			success: false,
			error: "too_short",
			data: {
				field: "firstName",
				min: 5,
			},
		});
	}

	// Firstname too long
	if (firstName.length > 255) {
		return res.status(422).send({
			success: false,
			error: "too_long",
			data: {
				field: "firstName",
				max: 255,
			},
		});
	}

	// Lastname too short
	if (lastName.length < 5) {
		return res.status(422).send({
			success: false,
			error: "too_short",
			data: {
				field: "lastName",
				min: 5,
			},
		});
	}

	// Lastname too long
	if (lastName.length > 255) {
		return res.status(422).send({
			success: false,
			error: "too_long",
			data: {
				field: "lastName",
				max: 255,
			},
		});
	}

	// Not an email
	if (
		!/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(
			email
		)
	) {
		return res.status(422).send({
			success: false,
			error: "incorrect",
			data: {
				field: "email",
			},
		});
	}

	// Email too long
	if (email.length > 255) {
		return res.status(422).send({
			success: false,
			error: "too_long",
			data: {
				field: "email",
				max: 255,
			},
		});
	}

	// Check if leerlingNummer and if it is a number
	if (leerlingNummer) {
		if (!Number.isInteger(leerlingNummer)) {
			return res.status(422).send({
				success: false,
				error: "invalid",
				data: {
					field: "leerlingNummer",
				},
			});
		}
	}

	try {
		const [email_result] = await db.query(`SELECT count(*) FROM users WHERE email = ?`, [email]);

		// User already exists
		if (email_result[0]["count(*)"] > 0) {
			return res.status(409).send({
				success: false,
				error: "taken",
				data: {
					field: "email",
				},
			});
		}
	} catch (error) {
		// Mysql error
		res.status(500).send({
			success: false,
			error: "mysql",
		});
	}

	// Check password
	// Password too long
	if (password.length > 255) {
		return res.status(422).send({
			success: false,
			error: "too_long",
			data: {
				field: "password",
				max: 255,
			},
		});
	}

	// Password too short
	if (password.length < 8) {
		return res.status(422).send({
			success: false,
			error: "too_short",
			data: {
				field: "password",
				min: 8,
			},
		});
	}

	// Invalid password
	// Atleast 8 characters long, atleast 1 lowercase, 1 uppercase, 1 number and 1 special character
	if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*_-])(?=.{8,})/.test(password)) {
		return res.status(422).send({
			success: false,
			error: "incorrect",
			data: {
				field: "password",
			},
		});
	}

	// Hash password
	const pwd = bcrypt.hashSync(password, 12);

	db.query("INSERT INTO users (firstName,lastName,email,leerlingNummer,password) VALUES (?,?,?,?,?)", [firstName, lastName, email, leerlingNummer, pwd])
		.then(([results]) => {
			// Select user from db without pwd
			db.query("SELECT id,first_name,last_name,email,leerling_nummer,vendor FROM users WHERE email=?", [email])
				.then(([results]) => {
					if (results.length < 1) {
						// No results thus not found
						res.status(404).send({
							success: false,
							error: "not-found",
						});
					} else {
						// Send user as data
						res.send({
							success: true,
							data: toCamel(results[0]),
						});
					}
				})
				.catch((error) => {
					// Mysql error
					res.status(500).send({
						success: false,
						error: "mysql",
					});
				});
		})
		.catch((error) => {
			// Mysql error
			res.status(500).send({
				success: false,
				error: "mysql",
			});
		});
});

// TODO: patch, delete

module.exports = router;
