const PRODUCT_TYPE_OPTIONS = {
	extra: 0,
	select: 1,
	chooseSelect: 2,
};

const db = require("./helpers/db");
const { toCamel, checkEmpty, objectToResponse } = require("./helpers/utils");

const { Router } = require("express");
const router = Router();

/**
 * @typedef {{
 * 	id?: Number,
 * 	name: String,
 * 	options: [{
 * 		id?: Number,
 * 		name: String,
 * 		type: Number,
 * 		choices?: [{
 * 			id?: Number,
 * 			name: String
 * 		}]
 * 	}]
 * }} ProductType
 */

/**
 * @param {Array<{
 * 	id: Number,
 * 	name: String,
 * 	option_id?: Number,
 * 	option_name?: String,
 * 	option_type?: Number,
 * 	choice_id?: Number,
 * 	choice_name?: String,
 * }>} rows
 * @returns {ProductType}
 */
const convertToTypeObject = (rows) => ({
	id: rows[0].id,
	name: rows[0].name,
	options: rows
		.filter((x, i) => !!x.option_id && rows.findIndex((y) => y.option_id === x.option_id) === i)
		.map((x) => {
			if (x.choice_id) {
				const choices = rows.filter((y) => y.option_id === x.option_id);

				return {
					id: x.option_id,
					name: x.option_name,
					type: x.option_type,
					choices: choices.map((y) => ({ id: y.choice_id, name: y.choice_name })),
				};
			} else {
				return {
					id: x.option_id,
					name: x.option_name,
					type: x.option_type,
				};
			}
		}),
});

router.get("/", (req, res) => {
	// Not loggedin return 401
	if (!req.isAuthenticated()) {
		return res.status(401).send({
			success: false,
			error: "unauthorized",
		});
	}

	db.query(
		`SELECT pt.id,pt.name, pto.id AS option_id, pto.name AS option_name, pto.type AS option_type,ptoc.id AS choice_id,ptoc.name AS choice_name
                FROM product_types as pt
                INNER JOIN product_types_options as ptso
                    ON pt.id = ptso.product_type
                INNER JOIN product_type_options as pto
                    ON ptso.product_type_option = pto.id
                LEFT JOIN product_type_options_choices as ptoscs
                    ON pto.id = ptoscs.product_type_option
                LEFT JOIN product_type_option_choices as ptoc
                    ON ptoscs.product_type_option_choice = ptoc.id`,
		[req.params.id]
	)
		.then(([results]) => {
			if (results.length < 1) {
				// No results thus not found
				return res.status(404).send({
					success: false,
					error: "not_found",
				});
			}

			const typeRows = {};
			for (let i = 0; i < results.length; i++) {
				const result = results[i];
				if (!typeRows[result.id]) typeRows[result.id] = [];
				typeRows[result.id].push(result);
			}

			const types = [];
			for (const id in typeRows) {
				types.push(convertToTypeObject(typeRows[id]));
			}

			res.send({
				success: true,
				data: toCamel(types),
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
	// Not loggedin return 401
	if (!req.isAuthenticated()) {
		return res.status(401).send({
			success: false,
			error: "unauthorized",
		});
	}

	db.query(
		`SELECT pt.id,pt.name, pto.id AS option_id, pto.name AS option_name, pto.type AS option_type,ptoc.id AS choice_id,ptoc.name AS choice_name
                FROM product_types as pt
                INNER JOIN product_types_options as ptso
                    ON pt.id = ptso.product_type
                INNER JOIN product_type_options as pto
                    ON ptso.product_type_option = pto.id
                LEFT JOIN product_type_options_choices as ptoscs
                    ON pto.id = ptoscs.product_type_option
                LEFT JOIN product_type_option_choices as ptoc
                    ON ptoscs.product_type_option_choice = ptoc.id
                WHERE pt.id = ?`,
		[req.params.id]
	)
		.then(([results]) => {
			if (results.length < 1) {
				// No results thus not found
				return res.status(404).send({
					success: false,
					error: "not_found",
				});
			}

			res.send({
				success: true,
				data: toCamel(convertToTypeObject(results)),
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

	// Only vendors can add types
	if (!req.user.vendor) {
		return res.status(403).send({
			success: false,
			error: "forbidden",
		});
	}

	/**
	 * Destructure body
	 * @type {ProductType}
	 */
	const { name, options } = req.body;

	// Check empties
	const empty = checkEmpty(["name"], req.body);
	if (empty) return objectToResponse(res, empty);

	// Name too short
	if (name.length < 3) {
		return res.status(422).send({
			success: false,
			error: "too_short",
			data: {
				field: "name",
				min: 3,
			},
		});
	}

	// Name too long
	if (name.length > 255) {
		return res.status(422).send({
			success: false,
			error: "too_long",
			data: {
				field: "name",
				max: 255,
			},
		});
	}

	try {
		const [nameResult] = await db.query(`SELECT count(*) FROM product_types WHERE name = ?`, [name]);

		// Product type already exists
		if (nameResult[0]["count(*)"] > 0) {
			return res.status(409).send({
				success: false,
				error: "taken",
				data: {
					field: "name",
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

	if (options) {
		if (!Array.isArray(options)) {
			return res.status(422).send({
				success: false,
				error: "invalid",
				data: {
					field: "options",
				},
			});
		}

		// Check if options are valid
		if (
			options.some(
				(x) =>
					// Check if all fields exists
					!x.name ||
					!x.type ||
					// Check if fields are correct
					typeof x.name !== "string" ||
					typeof x.type !== "number" ||
					!Object.values(PRODUCT_TYPE_OPTIONS).includes(x.type) ||
					x.name.length < 3 ||
					x.name.length > 255 ||
					// Check types
					((x.type === PRODUCT_TYPE_OPTIONS.chooseSelect || x.type === PRODUCT_TYPE_OPTIONS.select) && !x.choices) ||
					// Check if choices are correct
					(x.choices && x.choices.some((y) => typeof y.name !== "string" || y.name.length < 3 || y.name.length > 255))
			)
		) {
			return res.status(422).send({
				success: false,
				error: "incorrect",
				data: {
					field: "options",
				},
			});
		}
	}
	try {
		// Insert product_type
		const [insertResults] = await db.query("INSERT INTO product_types (name) VALUES (?)", [name]);

		// Insert options
		if (options) {
			for (let i = 0; i < options.length; i++) {
				const option = options[i];
				// Insert option
				const [insertOptionResults] = await db.query("INSERT INTO product_type_options (name,type) VALUES (?,?)", [option.name, option.type]);

				// Insert types options
				const [insertTypesOptionsResults] = await db.query("INSERT INTO product_types_options (product_type, product_type_option) VALUES (?,?)", [
					insertResults.insertId,
					insertOptionResults.insertId,
				]);

				// Insert choices
				if (option.choices) {
					for (let i = 0; i < option.choices.length; i++) {
						const choice = option.choices[i];
						// Insert choice
						const [insertChoiceResults] = await db.query("INSERT INTO product_type_option_choices (name) VALUES (?)", [choice.name]);

						// Insert type options choices
						const [insertTypeOptionsChoicesResults] = await db.query(
							"INSERT INTO product_type_options_choices (product_type_option, product_type_option_choice) VALUES (?,?)",
							[insertOptionResults.insertId, insertChoiceResults.insertId]
						);
					}
				}
			}
		}

		// Get inserted product type
		db.query(
			`SELECT pt.id,pt.name, pto.id AS option_id, pto.name AS option_name, pto.type AS option_type,ptoc.id AS choice_id,ptoc.name AS choice_name
                FROM product_types as pt
                INNER JOIN product_types_options as ptso
                    ON pt.id = ptso.product_type
                INNER JOIN product_type_options as pto
                    ON ptso.product_type_option = pto.id
                LEFT JOIN product_type_options_choices as ptoscs
                    ON pto.id = ptoscs.product_type_option
                LEFT JOIN product_type_option_choices as ptoc
                    ON ptoscs.product_type_option_choice = ptoc.id
                WHERE pt.id = ?`,
			[insertResults.insertId]
		)
			.then(([results]) => {
				if (results.length < 1) {
					// No results thus not found
					return res.status(404).send({
						success: true,
						data: null,
					});
				}

				res.send({
					success: true,
					data: toCamel(convertToTypeObject(results)),
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
	} catch (error) {
		console.log(error);
		// Mysql error
		res.status(500).send({
			success: false,
			error: "mysql",
		});
	}
});

router.patch("/:id", async (req, res) => {
	// Not loggedin return 401
	if (!req.isAuthenticated()) {
		return res.status(401).send({
			success: false,
			error: "unauthorized",
		});
	}

	// Only vendors can change types
	if (!req.user.vendor) {
		return res.status(403).send({
			success: false,
			error: "forbidden",
		});
	}

	/**
	 * @type {ProductType}
	 */
	const { name, options } = req.body;
	// TODO: patch
});

router.delete("/:id", async (req, res) => {
	// Not loggedin return 401
	if (!req.isAuthenticated()) {
		return res.status(401).send({
			success: false,
			error: "unauthorized",
		});
	}

	// Only vendors can delete product types
	if (!req.user.vendor) {
		return res.status(403).send({
			success: false,
			error: "forbidden",
		});
	}

	// Check if product type exists
	try {
		const [getResult] = await db.query(
			`SELECT pt.id,pt.name, pto.id AS option_id, pto.name AS option_name, pto.type AS option_type,ptoc.id AS choice_id,ptoc.name AS choice_name
                FROM product_types as pt
                INNER JOIN product_types_options as ptso
                    ON pt.id = ptso.product_type
                INNER JOIN product_type_options as pto
                    ON ptso.product_type_option = pto.id
                LEFT JOIN product_type_options_choices as ptoscs
                    ON pto.id = ptoscs.product_type_option
                LEFT JOIN product_type_option_choices as ptoc
                    ON ptoscs.product_type_option_choice = ptoc.id
                WHERE pt.id = ?`,
			[req.params.id]
		);

		// Product type not found
		if (getResult.length < 1) {
			return res.status(404).send({
				success: false,
				error: "not_found",
			});
		}

		const [deleteResults] = await db.query(
			`DELETE pt,pto,ptoc,ptso,ptoscs FROM product_types as pt
                INNER JOIN product_types_options as ptso
                    ON pt.id = ptso.product_type
                INNER JOIN product_type_options as pto
                    ON ptso.product_type_option = pto.id
                LEFT JOIN product_type_options_choices as ptoscs
                    ON pto.id = ptoscs.product_type_option
                LEFT JOIN product_type_option_choices as ptoc
                    ON ptoscs.product_type_option_choice = ptoc.id
                WHERE pt.id = ?`,
			[req.params.id]
		);

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
