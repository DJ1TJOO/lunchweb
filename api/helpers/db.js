const mysql = require("mysql2");

// Make connection to db and create pool
const configuration = {
	host: "localhost",
	user: "root",
	database: "lunchweb",
	dateStrings: true,
};
module.exports = mysql.createPool(configuration).promise();

module.exports.escape = mysql.escape;
