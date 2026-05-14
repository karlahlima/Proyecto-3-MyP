require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
	host: process.env.PGHOST,
	port: Number(process.env.PGPORT || 5432),
	database: process.env.PGDATABASE,
	user: process.env.PGUSER,
	password: process.env.PGPASSWORD,
});

module.exports = pool;
