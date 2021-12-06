const db = require("./helpers/db");
const { toCamel } = require("./helpers/utils");

const { Router } = require("express");
const { PRODUCT_TYPE_OPTIONS } = require("./product_types");
const router = Router();

const convertToOrderObject = (rows) => ({
	id: rows[0].id,
	user_id: rows[0].user_id,
	firstname: rows[0].first_name,
	lastname: rows[0].last_name,
	email: rows[0].email,
	leerling_nummer: rows[0].leerling_nummer,
	status: rows[0].status,
	deliver: rows[0].deliver,
	products: rows
		.filter((x, i) => !!x.order_product_id && rows.findIndex((y) => y.order_product_id === x.order_product_id) === i)
		.map((orderProduct) => {
			return {
				id: orderProduct.product_id,
				title: orderProduct.title,
				summary: orderProduct.summary,
				price: orderProduct.price,
				type: orderProduct.type,
				note: orderProduct.note,
				quantity: orderProduct.quantity,
				order_product_id: orderProduct.order_product_id,
				options: rows
					.filter((x) => x.order_product_id === orderProduct.order_product_id)
					.map((orderProduct) => {
						if (orderProduct.order_product_option_type === PRODUCT_TYPE_OPTIONS.extra) {
							return {
								id: orderProduct.order_product_option_id,
								name: orderProduct.order_product_option_name,
								type: orderProduct.order_product_option_type,
								value: Boolean(orderProduct.order_product_option_value),
							};
						} else if (orderProduct.order_product_option_type === PRODUCT_TYPE_OPTIONS.select) {
							return {
								id: orderProduct.order_product_option_id,
								name: orderProduct.order_product_option_name,
								type: orderProduct.order_product_option_type,
								value: orderProduct.product_type_option_choices_name,
								value_id: orderProduct.order_product_option_value,
							};
						}
					}),
			};
		}),
});

router.get("/", () => {
	// Not loggedin return 401
	if (!req.isAuthenticated()) {
		return res.status(401).send({
			success: false,
			error: "unauthorized",
		});
	}

	// Only vendors can access all orders
	if (!req.user.vendor) {
		return res.status(403).send({
			success: false,
			error: "forbidden",
		});
	}

	db.query(
		`SELECT orders.id,
                orders.user_id,
				users.first_name,
				users.last_name,
				users.email,
				users.leerling_nummer,
                orders.status,
                orders.deliver,
                order_product.id AS order_product_id,
                order_product.quantity,
                order_product.note,
                products.id AS product_id,
                products.title,
                products.summary,
                products.price,
				product_types.name AS type,
				product_types.id AS type_id,
				order_product_options.id AS order_product_option_id,
				order_product_options.name AS order_product_option_name,
				order_product_options.type AS order_product_option_type,
				order_product_options.value AS order_product_option_value,
				product_type_option_choices.name AS product_type_option_choices_name FROM orders
        LEFT OUTER JOIN order_product ON orders.id = order_product.order_id
		LEFT OUTER JOIN users ON orders.user_id = users.id
        LEFT OUTER JOIN products ON order_product.product_id = products.id
        LEFT OUTER JOIN order_product_options ON order_product.id = order_product_options.order_product_id
		LEFT OUTER JOIN product_types ON products.type = product_types.id
        LEFT OUTER JOIN product_type_option_choices ON order_product_options.value = product_type_option_choices.id`
	)
		.then(([results]) => {
			const orderRows = {};
			for (let i = 0; i < results.length; i++) {
				const result = results[i];
				if (!orderRows[result.id]) orderRows[result.id] = [];
				orderRows[result.id].push(result);
			}

			const orders = [];
			for (const id in orderRows) {
				orders.push(convertToOrderObject(orderRows[id]));
			}

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

router.get("/:id", async (req, res) => {
	// Not loggedin return 401
	if (!req.isAuthenticated()) {
		return res.status(401).send({
			success: false,
			error: "unauthorized",
		});
	}

	// Only vendors can access orders
	if (!req.user.vendor) {
		return res.status(403).send({
			success: false,
			error: "forbidden",
		});
	}

	db.query(
		`SELECT orders.id,
                orders.user_id,
				users.first_name,
				users.last_name,
				users.email,
				users.leerling_nummer,
                orders.status,
                orders.deliver,
                order_product.id AS order_product_id,
                order_product.quantity,
                order_product.note,
                products.id AS product_id,
                products.title,
                products.summary,
                products.price,
				product_types.name AS type,
				product_types.id AS type_id,
				order_product_options.id AS order_product_option_id,
				order_product_options.name AS order_product_option_name,
				order_product_options.type AS order_product_option_type,
				order_product_options.value AS order_product_option_value,
				product_type_option_choices.name AS product_type_option_choices_name FROM orders
        LEFT OUTER JOIN order_product ON orders.id = order_product.order_id
		LEFT OUTER JOIN users ON orders.user_id = users.id
        LEFT OUTER JOIN products ON order_product.product_id = products.id
        LEFT OUTER JOIN order_product_options ON order_product.id = order_product_options.order_product_id
		LEFT OUTER JOIN product_types ON products.type = product_types.id
        LEFT OUTER JOIN product_type_option_choices ON order_product_options.value = product_type_option_choices.id
		WHERE orders.id = ?`,
		[req.params.id]
	)
		.then(([results]) => {
			console.log(JSON.stringify(results));
			// Order not found
			if (results.length < 1) {
				return res.status(404).send({
					success: false,
					error: "not_found",
				});
			}

			res.send({
				success: true,
				data: toCamel(convertToOrderObject(results)),
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

	const { deliver, products } = req.body;

	req.uest({ method: "GET", url: "api/products" }, (_err, _res, productsData) => {
		if (!productsData.data) {
			// Mysql error
			return res.status(500).send({
				success: false,
				error: "mysql",
			});
		}

		for (let i = 0; i < products.length; i++) {
			const product = products[i];
			if (productsData.data.find((x) => x.id === product.id)) continue;

			// Product not found error
			return res.status(404).send({
				success: false,
				error: "invalid",
				data: {
					field: "products",
				},
			});
		}

		db.query(`INSERT INTO orders (user_id, status, deliver) VALUES (?,?,?)`, [req.user.id, 0, new Date(deliver)])
			.then(async ([insertResults]) => {
				const orderId = insertResults.insertId;
				try {
					for (let i = 0; i < products.length; i++) {
						const product = products[i];
						const [insertResults] = await db.query(`INSERT INTO order_product (order_id, product_id, quantity, note) VALUES (?,?,?,?)`, [
							orderId,
							product.id,
							product.quantity,
							product.note,
						]);

						for (let i = 0; i < product.typeValue.options.length; i++) {
							const option = product.typeValue.options[i];
							db.query(`INSERT INTO order_product_options (order_product_id, name, type, value) VALUES (?,?,?,?)`, [
								insertResults.insertId,
								option.name,
								option.type,
								option.value,
							]);
						}
					}

					db.query(
						`SELECT orders.id,
							orders.user_id,
							users.first_name,
							users.last_name,
							users.email,
							users.leerling_nummer,
							orders.status,
							orders.deliver,
							order_product.id AS order_product_id,
							order_product.quantity,
							order_product.note,
							products.id AS product_id,
							products.title,
							products.summary,
							products.price,
							product_types.name AS type,
							product_types.id AS type_id,
							order_product_options.id AS order_product_option_id,
							order_product_options.name AS order_product_option_name,
							order_product_options.type AS order_product_option_type,
							order_product_options.value AS order_product_option_value,
							product_type_option_choices.name AS product_type_option_choices_name FROM orders
					LEFT OUTER JOIN order_product ON orders.id = order_product.order_id
					LEFT OUTER JOIN users ON orders.user_id = users.id
					LEFT OUTER JOIN products ON order_product.product_id = products.id
					LEFT OUTER JOIN order_product_options ON order_product.id = order_product_options.order_product_id
					LEFT OUTER JOIN product_types ON products.type = product_types.id
					LEFT OUTER JOIN product_type_option_choices ON order_product_options.value = product_type_option_choices.id
					WHERE orders.id = ?`,
						[orderId]
					)
						.then(([results]) => {
							res.send({
								success: true,
								data: toCamel(convertToOrderObject(results)),
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
});

router.delete("/:id", async (req, res) => {
	// Not loggedin return 401
	if (!req.isAuthenticated()) {
		return res.status(401).send({
			success: false,
			error: "unauthorized",
		});
	}

	// Only vendors can access orders
	if (!req.user.vendor) {
		return res.status(403).send({
			success: false,
			error: "forbidden",
		});
	}

	db.query(
		`SELECT orders.id,
                orders.user_id,
				users.first_name,
				users.last_name,
				users.email,
				users.leerling_nummer,
                orders.status,
                orders.deliver,
                order_product.id AS order_product_id,
                order_product.quantity,
                order_product.note,
                products.id AS product_id,
                products.title,
                products.summary,
                products.price,
				product_types.name AS type,
				product_types.id AS type_id,
				order_product_options.id AS order_product_option_id,
				order_product_options.name AS order_product_option_name,
				order_product_options.type AS order_product_option_type,
				order_product_options.value AS order_product_option_value,
				product_type_option_choices.name AS product_type_option_choices_name FROM orders
        LEFT OUTER JOIN order_product ON orders.id = order_product.order_id
		LEFT OUTER JOIN users ON orders.user_id = users.id
        LEFT OUTER JOIN products ON order_product.product_id = products.id
        LEFT OUTER JOIN order_product_options ON order_product.id = order_product_options.order_product_id
		LEFT OUTER JOIN product_types ON products.type = product_types.id
        LEFT OUTER JOIN product_type_option_choices ON order_product_options.value = product_type_option_choices.id
		WHERE orders.id = ?`,
		[req.params.id]
	)
		.then(async ([results]) => {
			// Order not found
			if (results.length < 1) {
				return res.status(404).send({
					success: false,
					error: "not_found",
				});
			}

			// Delete order and order_products
			const [deleteResults] = await db.query(
				`DELETE orders.id,
					orders.user_id,
					orders.status,
					orders.deliver,
					order_product.id AS order_product_id,
					order_product.quantity,
					order_product.note,
					products.id AS product_id,
					products.title,
					products.summary,
					products.price,
					products.type,
					order_product_options.id AS order_product_option_id,
					order_product_options.name AS order_product_option_name,
					order_product_options.type AS order_product_option_type,
					order_product_options.value AS order_product_option_value FROM orders
			LEFT OUTER JOIN order_product ON orders.id = order_product.order_id
			LEFT OUTER JOIN products ON order_product.product_id = products.id
        	LEFT OUTER JOIN order_product_options ON order_product.id = order_product_options.order_product_id
			WHERE orders.id = ?`,
				[req.params.id]
			);

			if (deleteResults.affectedRows < 1) {
				return res.send({
					success: false,
					error: "failed_to_delete",
				});
			}

			res.send({
				success: true,
				data: toCamel(convertToOrderObject(results)),
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

module.exports = router;
