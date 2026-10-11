const test = require("node:test");
const assert = require("node:assert/strict");
const { parsePage } = require("../src/controllers/auditLogController");

test("audit pagination accepts bounded integers", () => {
  assert.equal(parsePage(undefined, 30, 100), 30);
  assert.equal(parsePage("50", 30, 100), 50);
  assert.equal(parsePage("1000", 30, 100), null);
});

test("audit pagination rejects decimals, negatives and arbitrary strings", () => {
  for (const value of ["0", "-1", "1.5", "bad", "01", ["1"]]) {
    assert.equal(parsePage(value, 30, 100), null);
  }
});
