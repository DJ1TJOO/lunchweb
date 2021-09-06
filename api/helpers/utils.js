/**
 * Makes string camel cased
 * @param {String} s
 * @returns {String}
 */
const stringToCamel = (s) => {
	return s.replace(/([-_][a-z])/gi, ($1) => {
		return $1.toUpperCase().replace("-", "").replace("_", "");
	});
};

/**
 * Check if o is and object
 * @param {any} o
 * @returns {Boolean}
 */
const isObject = (o) => o === Object(o) && !Array.isArray(o) && typeof o !== "function";

/**
 * Makes obj keys with nested obj keys camel cased
 * @param {any} obj
 * @returns {any}
 */
const toCamel = (obj) => {
	if (isObject(obj)) {
		const n = {};

		const keys = Object.keys(obj);
		for (let i = 0; i < keys.length; i++) {
			n[stringToCamel(keys[i])] = toCamel(obj[keys[i]]);
		}

		return n;
	} else if (Array.isArray(obj)) {
		return obj.map((i) => toCamel(i));
	}

	return obj;
};
module.exports.toCamel = toCamel;

/**
 * @param {Array<String>} fields
 * @param {any} body
 * @returns {void | {
 * 	status: 442,
 * 	success: false,
 * 	error: "empty",
 * 	data: {
 * 		field: String
 * 	}
 * }}
 */
module.exports.checkEmpty = (fields, body) => {
	for (let i = 0; i < fields.length; i++) {
		const field = fields[i];
		if (body[field]) continue;

		return {
			status: 422,
			success: false,
			error: "empty",
			data: {
				field,
			},
		};
	}
};

/**
 * @param {import("express").Response} res
 * @param {Object} obj
 */
module.exports.objectToResponse = (res, obj) => {
	if (obj.status) {
		const { status, ...send } = obj;
		return res.status(status).send(send);
	} else {
		return res.send(obj);
	}
};
