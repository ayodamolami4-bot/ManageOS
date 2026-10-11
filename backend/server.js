const app =
  require("./src/app");

const pool =
  require("./src/db/database");

const PORT =
  Number(
    process.env.PORT || 5000
  );

const server =
  app.listen(
    PORT,
    () => {
      console.log(
        `ManageOS API running on http://localhost:${PORT}`
      );
    }
  );

let isShuttingDown =
  false;

async function gracefulShutdown(
  signal
) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(
    `${signal} received. Shutting down ManageOS gracefully...`
  );

  /*
   * Stop accepting new HTTP connections.
   */
  server.close(
    async (serverError) => {
      if (serverError) {
        console.error(
          "HTTP server shutdown failed:",
          serverError
        );

        process.exitCode = 1;
      }

      try {
        /*
         * Close the PostgreSQL pool after
         * the HTTP server has stopped accepting
         * new requests.
         */
        await pool.end();

        console.log(
          "PostgreSQL connection pool closed."
        );
      } catch (databaseError) {
        console.error(
          "PostgreSQL pool shutdown failed:",
          databaseError
        );

        process.exitCode = 1;
      }

      process.exit();
    }
  );
}

process.on(
  "SIGTERM",
  () => {
    gracefulShutdown(
      "SIGTERM"
    );
  }
);

process.on(
  "SIGINT",
  () => {
    gracefulShutdown(
      "SIGINT"
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "Uncaught exception:",
      error
    );

    gracefulShutdown(
      "uncaughtException"
    );
  }
);

process.on(
  "unhandledRejection",
  (reason) => {
    console.error(
      "Unhandled promise rejection:",
      reason
    );

    gracefulShutdown(
      "unhandledRejection"
    );
  }
);