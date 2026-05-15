CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	username VARCHAR(50) NOT NULL UNIQUE,
	age INTEGER NOT NULL CHECK (age >= 18),
	password_hash TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
	id_customer INTEGER,
	id_purchases INTEGER,
	id_sales INTEGER,
	PRIMARY KEY (id_customer, id_purchases),
	FOREIGN KEY (id_customer) REFERENCES users(id)
)