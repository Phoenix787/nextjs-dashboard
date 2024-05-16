const { Pool } = require('pg');

let conn;

if (!conn) {
	conn = new Pool({
		user: process.env.POSTGRES_USER,
		password: process.env.POSTGRES_PASSWORD,
		host: process.env.POSTGRES_HOST,
		port: Number(process.env.POSTGRES_PORT),
	});
}

module.exports = {
	conn,
};
