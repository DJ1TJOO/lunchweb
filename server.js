const express = require("express");
const expressHandlebars = require("express-handlebars");

const app = express();

app.engine("handlebars", expressHandlebars());
app.set("view engine", "handlebars");

app.use("/api", require("./api/router"));

app.get("/", function (req, res) {
	res.render("home", { title: "Home" });
});

app.listen(3000, () => console.log("Running on http://localhost:3000"));
