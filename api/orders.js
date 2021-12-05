const db = require("./helpers/db");
const { checkEmpty, toCamel, objectToResponse } = require("./helpers/utils");

const { Router } = require("express");
const router = Router();

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
                orders.status,
                orders.deliver,
                order_product.id AS order_product_id,
                order_product.quantity,
                order_product.note,
                products.id AS product_id,
                products.title,
                products.summary,
                products.price,
                products.type FROM orders
        LEFT JOIN order_product ON orders.id = order_product.order_id
        LEFT JOIN products ON order_product.product_id = products.id`
	)
		.then(([results]) => {
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
                orders.status,
                orders.deliver,
                order_product.id AS order_product_id,
                order_product.quantity,
                order_product.note,
                products.id AS product_id,
                products.title,
                products.summary,
                products.price,
                products.type FROM orders
        LEFT JOIN order_product ON orders.id = order_product.order_id
        LEFT JOIN products ON order_product.product_id = products.id
		WHERE oders.id = ?`,
		[req.params.id]
	)
		.then(([results]) => {
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
			.then(([insertResults]) => {
				const orderId = insertResults.insertId;
				try {
					for (let i = 0; i < products.length; i++) {
						const product = products[i];
						db.query(`INSERT INTO order_product (oder_id, product_id, quantity, note) VALUES (?,?,?,?)`, [orderId, product.id, product.quantity, product.note]);
					}

					db.query(
						`SELECT orders.id,
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
							products.type FROM orders
					LEFT JOIN order_product ON orders.id = order_product.order_id
					LEFT JOIN products ON order_product.product_id = products.id
					WHERE orders.id = ?`,
						[orderId]
					)
						.then(([results]) => {
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

router.delete("/:id", (req, res) => {
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
                orders.status,
                orders.deliver,
                order_product.id AS order_product_id,
                order_product.quantity,
                order_product.note,
                products.id AS product_id,
                products.title,
                products.summary,
                products.price,
                products.type FROM orders
        LEFT JOIN order_product ON orders.id = order_product.order_id
        LEFT JOIN products ON order_product.product_id = products.id
		WHERE oders.id = ?`,
		[req.params.id]
	)
		.then(([results]) => {
			// Order not found
			if (results.length < 1) {
				return res.status(404).send({
					success: false,
					error: "not_found",
				});
			}

			// Delete order and oder_products
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
					products.type FROM orders
			LEFT JOIN order_product ON orders.id = order_product.order_id
			LEFT JOIN products ON order_product.product_id = products.id
			WHERE oders.id = ?`,
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

module.exports = router;
