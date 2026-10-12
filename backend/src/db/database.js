require("dotenv").config();

const { Pool } = require("pg");

// Managed Postgres providers (including Neon/Render) supply DATABASE_URL.
// Keep the existing local DB_* variables for developer and CI environments.
const pool = new Pool(process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

module.exports = pool;