const PRODUCT_TYPE_OPTIONS = {
	extra: 0,
	select: 1,
	chooseSelect: 2,
};

const db = require("./helpers/db");
const { toCamel } = require("./helpers/utils");

const { Router } = require("express");
const router = Router();

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

router.post("/", (req, res) => {
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

	// TODO: post
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
