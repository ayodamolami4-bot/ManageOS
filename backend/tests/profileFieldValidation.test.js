const test = require("node:test");
const assert = require("node:assert/strict");
const { updateUserSchema } = require("../src/validators/userSchemas");

const profile = {
  firstName: "Ayo",
  lastName: "Adesina",
  email: "ayo@example.com",
  phone: null,
  country: "Nigeria",
  timezone: "Africa/Lagos",
  jobTitle: "Developer",
  avatarUrl: null
};

test("profile accepts international alphabetic names and countries", () => {
  assert.equal(updateUserSchema.safeParse({
    ...profile,
    firstName: "Adé",
    lastName: "O'Connor",
    country: "Côte d'Ivoire"
  }).success, true);
});

test("profile rejects digits in names and countries", () => {
  assert.equal(updateUserSchema.safeParse({
    ...profile, firstName: "Ayo123"
  }).success, false);
  assert.equal(updateUserSchema.safeParse({
    ...profile, country: "1234"
  }).success, false);
});

test("profile permits no country until one is supplied", () => {
  assert.equal(updateUserSchema.safeParse({
    ...profile, country: null
  }).success, true);
});
