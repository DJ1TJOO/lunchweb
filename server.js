const express = require("express");
const expressHandlebars = require("express-handlebars");

const middleware = require("./middleware");
const passport = require("./passport");

// Add env variables
require("dotenv").config();

const app = express();

// Add middleware
middleware(app);

// Add passport
passport(app);

// Setup handlebars view engine
app.engine(
	"handlebars",
	expressHandlebars({
		helpers: {
			json: (content) => JSON.stringify(content),
			capitalizeFirstLetter: (content) => content.charAt(0).toUpperCase() + content.slice(1),
			formatPrice: (price) =>
				Number(price)
					.toLocaleString("en-US", {
						style: "currency",
						currency: "EUR",
					})
					.replace(".", "dot")
					.replace(",", ".")
					.replace("dot", ","),
		},
	})
);
app.set("view engine", "handlebars");

app.use("/static", express.static("./public"));
app.use("/api", require("./api/router"));

app.get("/", function (req, res) {
	if (!req.isAuthenticated()) return res.redirect("/login");
	req.uest(
		{
			method: "GET",
			url: "/api/products",
		},
		(_err, _res, productData) =>
			req.uest(
				{
					method: "GET",
					url: "/api/product-types",
				},
				(_err, _res, productTypes) => {
					const types = [...new Set(productTypes.data.map((productType) => productType.name))];
					const products = {};
					for (let i = 0; i < types.length; i++) {
						const type = types[i];
						products[type] = productData.data.filter((product) => product.type === type);
					}

					res.render("home", { title: "Home", products: products, categories: types, productTypes: productTypes.data });
				}
			)
	);
});

app.get("/login", function (req, res) {
	res.render("login", { title: "Login", message: req.user });
});
app.get("/register", function (req, res) {
	res.render("register", { title: "Register" });
});

app.listen(3000, () => console.log("Running on http://localhost:3000"));
