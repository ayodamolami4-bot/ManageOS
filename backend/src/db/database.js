require("dotenv").config();

const { Pool } = require("pg");

// Short, bounded waits stop an unreachable managed DB from leaving HTTP
// requests pending forever. This is one Render Free instance, not a large
// fleet; keep connections conservative to stay within Neon Free limits.
const config = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool({
  ...config,
  max: 8,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  query_timeout: 10000,
});

// An error on an idle client would otherwise be an unhandled EventEmitter
// error capable of terminating the Node process. Do not log connection
// strings, usernames or credentials.
pool.on("error", (error) => {
  console.error("Idle PostgreSQL connection error", {
    code: String(error.code || "DB_CONNECTION_ERROR").slice(0, 64),
  });
});

module.exports = pool;
