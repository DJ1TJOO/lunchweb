const db = require("./helpers/db");
const { checkEmpty, toCamel, objectToResponse } = require("./helpers/utils");

const { Router } = require("express");
const router = Router();

// TODO: order routes
router.get("/", () => {
	// Not loggedin return 401
	if (!req.isAuthenticated()) {
		return res.status(401).send({
			success: false,
			error: "unauthorized",
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
	);

	// Only vendors can access all orders
	if (!req.user.vendor) {
		return res.status(403).send({
			success: false,
			error: "forbidden",
		});
	}
});

module.exports = router;
