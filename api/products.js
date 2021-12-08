const db = require("./helpers/db");
const { checkEmpty, toCamel, objectToResponse } = require("./helpers/utils");

const { Router } = require("express");
const router = Router();

router.get("/", (req, res) => {
	// Select product from db
	db.query(
		"SELECT products.id,products.title,products.summary,products.price,product_types.name AS type,product_types.id AS type_id FROM products LEFT JOIN product_types ON products.type = product_types.id"
	)
		.then(([results]) => {
			// Send products as data
			res.send({
				success: true,
				data: toCamel(results),
			});
		})
		.catch((error) => {
			console.log(error);
			// Mysql error
			res.status(500).send({
				success: false,
				error: "mysql",
			});
		});
});

router.get("/:id", (req, res) => {
	// Select product from db
	db.query(
		"SELECT products.id,products.title,products.summary,products.price,product_types.name AS type,product_types.id AS type_id FROM products LEFT JOIN product_types ON products.type = product_types.id WHERE products.id=?",
		[req.params.id]
	)
		.then(([results]) => {
			if (results.length < 1) {
				// No results thus not found
				res.status(404).send({
					success: false,
					error: "not_found",
				});
			} else {
				// Send product as data
				res.send({
					success: true,
					data: toCamel(results[0]),
				});
			}
		})
		.catch((error) => {
			console.log(error);
			// Mysql error
			res.status(500).send({
				success: false,
				error: "mysql",
			});
		});
});

router.get("/types/:type", (req, res) => {
	// Select product from db
	db.query(
		"SELECT products.id,products.title,products.summary,products.price,product_types.name AS type,product_types.id AS type_id FROM products LEFT JOIN product_types ON products.type = product_types.id WHERE products.type = ?",
		[req.params.type]
	)
		.then(([results]) => {
			// Send products as data
			res.send({
				success: true,
				data: toCamel(results),
			});
		})
		.catch((error) => {
			console.log(error);
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

	// Only vendors can add products
	if (!req.user.vendor) {
		return res.status(403).send({
			success: false,
			error: "forbidden",
		});
	}

	// Destructure body
	const { title, summary, price, type } = req.body;

	// Check empties
	const empty = checkEmpty(["title", "price", "type"], req.body);
	if (empty) return objectToResponse(res, empty);

	// Title too short
	if (title.length < 3) {
		return res.status(422).send({
			success: false,
			error: "too_short",
			data: {
				field: "title",
				min: 3,
			},
		});
	}

	// Title too long
	if (title.length > 255) {
		return res.status(422).send({
			success: false,
			error: "too_long",
			data: {
				field: "title",
				max: 255,
			},
		});
	}

	// Price is not a number
	if (Number.isNaN(price)) {
		return res.status(422).send({
			success: false,
			error: "invalid",
			data: {
				field: "price",
			},
		});
	}

	// Type is not a number
	if (Number.isNaN(type)) {
		return res.status(422).send({
			success: false,
			error: "invalid",
			data: {
				field: "type",
			},
		});
	}

	try {
		const [typeResult] = await db.query(`SELECT count(*) FROM product_types WHERE id = ?`, [type]);

		// Type doesn't exists
		if (typeResult[0]["count(*)"] < 1) {
			return res.status(404).send({
				success: false,
				error: "not_found",
				data: {
					field: "type",
				},
			});
		}
	} catch (error) {
		console.log(error);
		// Mysql error
		res.status(500).send({
			success: false,
			error: "mysql",
		});
	}

	if (typeof summary !== "undefined") {
		// Summary too long
		if (summary.length > 255) {
			return res.status(422).send({
				success: false,
				error: "too_long",
				data: {
					field: "summary",
					max: 255,
				},
			});
		}
	}

	db.query(
		"INSERT INTO products (title" +
			(typeof summary !== "undefined" ? ",summary" : "") +
			",price,type) VALUES (?," +
			(typeof summary !== "undefined" ? "'" + summary + "'," : "") +
			"?,?)",
		[title, price, type]
	)
		.then(([results]) => {
			// Select product from db
			db.query(
				"SELECT products.id,products.title,products.summary,products.price,product_types.name AS type,product_types.id AS type_id FROM products LEFT JOIN product_types ON products.type = product_types.id WHERE products.id=?",
				[results.insertId]
			)
				.then(([results]) => {
					if (results.length < 1) {
						// No results
						res.send({
							success: true,
							data: null,
						});
					} else {
						// Send product as data
						res.send({
							success: true,
							data: toCamel(results[0]),
						});
					}
				})
				.catch((error) => {
					console.log(error);
					// Mysql error
					res.status(500).send({
						success: false,
						error: "mysql",
					});
				});
		})
		.catch((error) => {
			console.log(error);
			// Mysql error
			res.status(500).send({
				success: false,
				error: "mysql",
			});
		});
});

router.patch("/:id", async (req, res) => {
	// Not loggedin return 401
	if (!req.isAuthenticated()) {
		return res.status(401).send({
			success: false,
			error: "unauthorized",
		});
	}

	// Only vendors can add products
	if (!req.user.vendor) {
		return res.status(403).send({
			success: false,
			error: "forbidden",
		});
	}

	// Check if product exists
	try {
		const [getResult] = await db.query(`SELECT count(*) FROM products WHERE id = ?`, [req.params.id]);

		// Product not found
		if (getResult[0]["count(*)"] < 1) {
			return res.status(404).send({
				success: false,
				error: "not_found",
			});
		}
	} catch (error) {
		console.log(error);
		// Mysql error
		res.status(500).send({
			success: false,
			error: "mysql",
		});
	}

	// Destructure body
	const { title, summary, price, type } = req.body;

	const update = {};
	if (typeof title !== "undefined") {
		// Title too short
		if (title.length < 3) {
			return res.status(422).send({
				success: false,
				error: "too_short",
				data: {
					field: "title",
					min: 3,
				},
			});
		}

		// Title too long
		if (title.length > 255) {
			return res.status(422).send({
				success: false,
				error: "too_long",
				data: {
					field: "title",
					max: 255,
				},
			});
		}

		update["title"] = title;
	}

	if (typeof price !== "undefined") {
		// Price is not a number
		if (Number.isNaN(price)) {
			return res.status(422).send({
				success: false,
				error: "invalid",
				data: {
					field: "price",
				},
			});
		}

		update["price"] = price;
	}

	if (typeof type !== "undefined") {
		// Type is not a number
		if (Number.isNaN(type)) {
			return res.status(422).send({
				success: false,
				error: "invalid",
				data: {
					field: "type",
				},
			});
		}

		try {
			const [typeResult] = await db.query(`SELECT count(*) FROM product_types WHERE id = ?`, [type]);

			// Type doesn't exists
			if (typeResult[0]["count(*)"] < 1) {
				return res.status(404).send({
					success: false,
					error: "not_found",
					data: {
						field: "type",
					},
				});
			}
		} catch (error) {
			console.log(error);
			// Mysql error
			res.status(500).send({
				success: false,
				error: "mysql",
			});
		}

		update["type"] = type;
	}

	if (typeof summary !== "undefined") {
		// Summary too long
		if (summary.length > 255) {
			return res.status(422).send({
				success: false,
				error: "too_long",
				data: {
					field: "summary",
					max: 255,
				},
			});
		}

		update["summary"] = summary;
	}

	const updates = Object.keys(update);

	// If no changes send product
	if (updates.length < 1) {
		// Select product from db
		db.query(
			"SELECT products.id,products.title,products.summary,products.price,product_types.name AS type,product_types.id AS type_id FROM products LEFT JOIN product_types ON products.type = product_types.id WHERE products.id=?",
			[req.params.id]
		)
			.then(([results]) => {
				if (results.length < 1) {
					// No results
					res.send({
						success: true,
						data: null,
					});
				} else {
					// Send product as data
					res.send({
						success: true,
						data: toCamel(results[0]),
					});
				}
			})
			.catch((error) => {
				console.log(error);
				// Mysql error
				res.status(500).send({
					success: false,
					error: "mysql",
				});
			});
	} else {
		// Update product in db
		db.query(`UPDATE products SET ${updates.map((x) => `${x} = ?`).join(",")} WHERE id = ?`, [...Object.values(update), req.params.id])
			.then(([results]) => {
				// Select product from db
				db.query(
					"SELECT products.id,products.title,products.summary,products.price,product_types.name AS type,product_types.id AS type_id FROM products LEFT JOIN product_types ON products.type = product_types.id WHERE products.id=?",
					[req.params.id]
				)
					.then(([results]) => {
						if (results.length < 1) {
							// No results
							res.send({
								success: true,
								data: null,
							});
						} else {
							// Send product as data
							res.send({
								success: true,
								data: toCamel(results[0]),
							});
						}
					})
					.catch((error) => {
						console.log(error);
						// Mysql error
						res.status(500).send({
							success: false,
							error: "mysql",
						});
					});
			})
			.catch((error) => {
				console.log(error);
				// Mysql error
				res.status(500).send({
					success: false,
					error: "mysql",
				});
			});
	}
});

router.delete("/:id", async (req, res) => {
	// Not loggedin return 401
	if (!req.isAuthenticated()) {
		return res.status(401).send({
			success: false,
			error: "unauthorized",
		});
	}

	// Only vendors can remove products
	if (!req.user.vendor) {
		return res.status(403).send({
			success: false,
			error: "forbidden",
		});
	}

	// Check if product exists
	try {
		const [getResult] = await db.query(
			`SELECT products.id,products.title,products.summary,products.price,product_types.name AS type,product_types.id AS type_id FROM products LEFT JOIN product_types ON products.type = product_types.id WHERE products.type = ?`,
			[req.params.id]
		);

		// Product not found
		if (getResult.length < 1) {
			return res.status(404).send({
				success: false,
				error: "not_found",
			});
		}

		const [deleteResults] = await db.query("DELETE FROM products WHERE id = ?", [req.params.id]);

		if (deleteResults.affectedRows < 1) {
			return res.send({
				success: false,
				error: "failed_to_delete",
			});
		}

		return res.send({
			success: true,
			data: toCamel(getResult[0]),
		});
	} catch (error) {
		console.log(error);
		// Mysql error
		res.status(500).send({
			success: false,
			error: "mysql",
		});
	}
});
module.exports = router;
