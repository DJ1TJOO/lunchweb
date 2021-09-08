const mysql = require("mysql2");

// Make connection to db and create pool
const configuration = {
	host: process.env.MYSQL_HOST,
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASS,
	database: process.env.MYSQL_DB,
	dateStrings: true,
};
module.exports = mysql.createPool(configuration).promise();

module.exports.escape = mysql.escape;
