const assert = require("node:assert/strict");
const test = require("node:test");
const { processFileDeletions } = require("../src/services/fileDeletionService");

function fakeDatabase(jobs) {
  const history = [];
  const client = {
    async query(sql, params = []) {
      history.push({ sql, params });
      if (sql.includes("SELECT id, storage_key")) {
        const candidate = jobs.find((job) => !job.finished && (!params[0] || params[0] === job.key));
        return { rows: candidate ? [{ id: candidate.id, storage_key: candidate.key }] : [] };
      }
      if (sql.includes("UPDATE file_deletion_jobs")) {
        const job = jobs.find((entry) => entry.id === params[0]);
        if (sql.includes("completed_at = NOW()")) job.finished = true;
        if (sql.includes("last_error_code = 'STORAGE_DELETE_FAILED'")) job.deferred = true;
      }
      return { rows: [] };
    },
    release() { history.push({ sql: "RELEASE" }); }
  };
  return { history, async connect() { return client; } };
}

test("deletion jobs are idempotent and marked complete after successful removal", async () => {
  const jobs = [{ id: "1", key: "files/a/2026/10/1.pdf" }];
  const database = fakeDatabase(jobs);
  const seen = [];
  const result = await processFileDeletions({
    database, remove: async (key) => seen.push(key), limit: 5
  });
  assert.deepEqual(result, { deleted: 1, deferred: 0 });
  assert.deepEqual(seen, [jobs[0].key]);
  assert.equal(jobs[0].finished, true);
  assert.ok(database.history.some((q) => q.sql.includes("SKIP LOCKED")));
  assert.ok(database.history.some((q) => q.sql.includes("completed_at = NOW()")));
});

test("provider failure records a durable retry rather than dropping the job", async () => {
  const jobs = [{ id: "2", key: "files/a/2026/10/2.pdf" }];
  const database = fakeDatabase(jobs);
  const result = await processFileDeletions({
    database,
    remove: async () => { throw new Error("provider secret never log"); },
    limit: 1,
  });
  assert.deepEqual(result, { deleted: 0, deferred: 1 });
  assert.equal(jobs[0].deferred, true);
  assert.notEqual(jobs[0].finished, true);
  const retry = database.history.find((query) => query.sql.includes("STORAGE_DELETE_FAILED"));
  assert.match(retry.sql, /next_attempt_at/);
  assert.doesNotMatch(JSON.stringify(database.history), /provider secret/);
});

test("targeted cleanup only processes the corresponding file", async () => {
  const jobs = [{ id: "3", key: "other" }, { id: "4", key: "target" }];
  const database = fakeDatabase(jobs);
  const result = await processFileDeletions({
    database, storageKey: "target", remove: async () => {}, limit: 10,
  });
  assert.equal(result.deleted, 1);
  assert.equal(jobs[0].finished, undefined);
  assert.equal(jobs[1].finished, true);
});

test("rejects unbounded batches", async () => {
  await assert.rejects(processFileDeletions({ limit: 10000 }), /INVALID_DELETION_BATCH_SIZE/);
});
