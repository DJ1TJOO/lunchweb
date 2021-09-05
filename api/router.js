const { Router } = require("express");
const router = Router();

router.use("/users", require("./users"));
router.use("/products", require("./products"));

module.exports = router;
