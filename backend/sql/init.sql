CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  username      VARCHAR(50)   NOT NULL UNIQUE,
  age           INTEGER       NOT NULL CHECK (age >= 18),
  password_hash TEXT          NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(255)  NOT NULL UNIQUE,
  title       VARCHAR(255)  NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  category    VARCHAR(100),
  stock       INTEGER       NOT NULL DEFAULT 1 CHECK (stock >= 0),
  image_url   TEXT,
  seller_id   INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_slug VARCHAR(255) NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  quantity     INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_slug)
);

CREATE TABLE IF NOT EXISTS purchases (
  id           SERIAL PRIMARY KEY,
  buyer_id     INTEGER NOT NULL REFERENCES users(id),
  product_slug VARCHAR(255) NOT NULL REFERENCES products(slug),
  quantity     INTEGER NOT NULL DEFAULT 1,
  total_price  NUMERIC(10,2) NOT NULL,
  bought_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id           SERIAL PRIMARY KEY,
  product_slug VARCHAR(255) NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  user_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id    INTEGER      REFERENCES comments(id) ON DELETE CASCADE,
  body         TEXT         NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comment_votes (
  id         SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  useful     BOOLEAN NOT NULL,
  UNIQUE (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS ratings (
  id           SERIAL PRIMARY KEY,
  product_slug VARCHAR(255) NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  user_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stars        INTEGER      NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (product_slug, user_id)
);