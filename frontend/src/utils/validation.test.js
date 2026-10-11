import test from "node:test";
import assert from "node:assert/strict";
import {
  validDate, validateName, validateRegistration,
  validateWorkDraft, toWorkPayload, validateUnitDraft
} from "./validation.js";

test("invalid calendar dates cannot be submitted", () => {
  assert.equal(validDate("2026-02-30"), false);
  assert.equal(validDate("2028-02-29"), true);
  assert.equal(validDate("2026-11-30"), true);
});

test("person names reject digits and symbols but accept accented names", () => {
  assert.ok(validateName("Lagos123", "City"));
  assert.equal(validateName("Adé-Ọlá"), "");
});

test("registration requires company, distinct names, valid email, secure password and consent", () => {
  const form = {
    companyName: "ManageOS Ltd",
    firstName: "Ada",
    lastName: "Obi",
    email: "ada@example.com",
    password: "long enough password",
    confirmPassword: "long enough password",
    acceptedTerms: true,
  };
  assert.deepEqual(validateRegistration(form), {});
  assert.ok(validateRegistration({ ...form, firstName: "123" }).firstName);
  assert.ok(validateRegistration({ ...form, email: "wrong" }).email);
  assert.ok(validateRegistration({ ...form, password: "short" }).password);
  assert.ok(validateRegistration({ ...form, confirmPassword: "wrong" }).confirmPassword);
});

test("work drafts reject invalid status, priority and date range", () => {
  const form = {
    name: "Operations migration", description: "", status: "ACTIVE",
    priority: "HIGH", startDate: "2026-11-12", dueDate: "2026-11-09"
  };
  assert.ok(validateWorkDraft(form).dueDate);
  assert.ok(validateWorkDraft({ ...form, dueDate: "2026-11-30", status: "WHATEVER" }).status);
  assert.deepEqual(
    validateWorkDraft({ ...form, dueDate: "2026-11-30" }),
    {}
  );
});

test("work payload uses null for cleared optional dates", () => {
  const p = toWorkPayload({
    title: "Improve service", description: "", status: "ACTIVE",
    priority: "MEDIUM", startDate: "", dueDate: "",
  }, { kind: "goal" });
  assert.equal(p.description, null);
  assert.equal(p.startDate, null);
});

test("unit validation rejects missing type and malformed IDs", () => {
  assert.ok(validateUnitDraft({ name: "North", type: "" }).type);
  assert.ok(validateUnitDraft({ name: "North", type: "Branch", parentUnitId: "abc" }).parentUnitId);
  assert.deepEqual(validateUnitDraft({ name: "North", type: "Branch" }), {});
});
