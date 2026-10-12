const pool = require("../db/database");
const { removeStoredFile } = require("../utils/fileStorageBackend");

/**
 * A bounded durable outbox processor. Uses FOR UPDATE SKIP LOCKED so a
 * manually-triggered job and a web request cannot delete one object twice.
 * Hold the row lock only for the remote request (bounded by storage timeout).
 */
async function processFileDeletions({
  database = pool,
  remove = removeStoredFile,
  limit = 20,
  storageKey = null,
} = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("INVALID_DELETION_BATCH_SIZE");
  }
  const stats = { deleted: 0, deferred: 0 };
  for (let i = 0; i < limit; i++) {
    const client = await database.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `SELECT id, storage_key
           FROM file_deletion_jobs
          WHERE completed_at IS NULL
            AND next_attempt_at <= NOW()
            AND ($1::text IS NULL OR storage_key = $1)
          ORDER BY created_at, id
          LIMIT 1
          FOR UPDATE SKIP LOCKED`,
        [storageKey]
      );
      if (!rows.length) {
        await client.query("COMMIT");
        break;
      }

      const job = rows[0];
      let failed = false;
      try {
        // The object might already have been removed. R2 delete is idempotent.
        await remove(job.storage_key);
      } catch {
        failed = true;
      }
      if (failed) {
        await client.query(
          `UPDATE file_deletion_jobs
              SET attempts = attempts + 1,
                  last_error_code = 'STORAGE_DELETE_FAILED',
                  next_attempt_at = NOW() +
                    LEAST(1440, POWER(2, LEAST(attempts + 1, 10))::int) *
                    INTERVAL '1 minute'
            WHERE id = $1`,
          [job.id]
        );
        stats.deferred++;
      } else {
        await client.query(
          `UPDATE file_deletion_jobs
              SET completed_at = NOW(),
                  attempts = attempts + 1,
                  last_error_code = NULL
            WHERE id = $1`,
          [job.id]
        );
        stats.deleted++;
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
    // A targeted immediate attempt should not process any unrelated files.
    if (storageKey) break;
  }
  return stats;
}

module.exports = { processFileDeletions };
