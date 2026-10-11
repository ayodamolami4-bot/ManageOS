require("dotenv").config();

const path =
  require("path");

const {
  runner
} = require(
  "node-pg-migrate"
);

async function runMigrations() {
  const requiredEnvironmentVariables = [
    "DB_USER",
    "DB_PASSWORD",
    "DB_HOST",
    "DB_PORT",
    "DB_NAME"
  ];

  for (
    const variable of
    requiredEnvironmentVariables
  ) {
    if (
      !process.env[variable]
    ) {
      throw new Error(
        `Missing required environment variable: ${variable}`
      );
    }
  }

  const databaseUrl =
    `postgres://${encodeURIComponent(
      process.env.DB_USER
    )}:` +
    `${encodeURIComponent(
      process.env.DB_PASSWORD
    )}@` +
    `${process.env.DB_HOST}:` +
    `${process.env.DB_PORT}/` +
    `${process.env.DB_NAME}`;

  const migrationsDirectory =
    path.resolve(
      __dirname,
      "migrations"
    );

  console.log(
    `Running migrations from: ${migrationsDirectory}`
  );

  await runner({
    databaseUrl,
    dir:
      migrationsDirectory,
    direction: "up",
    migrationsTable:
      "pgmigrations"
  });

  console.log(
    "Database migrations completed successfully"
  );
}

runMigrations()
  .catch((error) => {
    console.error(
      "Database migration failed:",
      error
    );

    process.exitCode = 1;
  });