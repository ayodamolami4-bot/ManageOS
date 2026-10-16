const test=require("node:test");
const assert=require("node:assert/strict");
const {requestEmailChangeSchema,confirmEmailChangeSchema} = require("../src/validators/emailChangeSchemas");
const {isToken,hashToken,TOKEN_HOURS,COOLDOWN_MINUTES}=require("../src/services/emailChangeService");

test("account email changes require a properly formatted new address and current password",()=>{
  assert.equal(requestEmailChangeSchema.safeParse({
    newEmail:"New@Example.Com",currentPassword:"current-password"
  }).data.newEmail,"new@example.com");
  assert.equal(requestEmailChangeSchema.safeParse({newEmail:"invalid",currentPassword:"x"}).success,false);
  assert.equal(requestEmailChangeSchema.safeParse({newEmail:"new@example.com",currentPassword:""}).success,false);
  assert.equal(requestEmailChangeSchema.safeParse({
    newEmail:"new@example.com",currentPassword:"x",userId:"other"
  }).success,false);
});
test("email-change verification links are strong, one-time-style tokens",()=>{
  assert.equal(isToken("a".repeat(64)),true);
  assert.equal(isToken("a".repeat(63)),false);
  assert.notEqual(hashToken("a".repeat(64)),"a".repeat(64));
  assert.equal(confirmEmailChangeSchema.safeParse({token:"a".repeat(64)}).success,true);
  assert.equal(confirmEmailChangeSchema.safeParse({token:"bad"}).success,false);
  assert.equal(TOKEN_HOURS,1);
  assert.ok(COOLDOWN_MINUTES>=1);
});
