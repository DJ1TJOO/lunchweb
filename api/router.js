const { Router } = require("express");
const router = Router();

router.use("/users", require("./users"));
router.use("/products", require("./products"));
router.use("/product-types", require("./product_types"));
router.use("/orders", require("./orders"));

module.exports = router;
