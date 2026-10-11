import test from "node:test";
import assert from "node:assert/strict";
import { notificationDestination } from "./notificationDestination.js";

const id = "190746ca-7283-4b4c-9ee6-c1cadb147755";
test("notifications link directly to real work resources", () => {
  assert.equal(notificationDestination({resource_type:"TASK",resource_id:id}), "/app/work?taskId="+id);
  assert.equal(notificationDestination({resource_type:"REQUEST",resource_id:id}), "/app/updates?requestId="+id);
  assert.equal(notificationDestination({resource_type:"PROJECT",resource_id:id}), "/app/projects/"+id);
  assert.equal(notificationDestination({resource_type:"DISCUSSION",resource_id:id}), "/app/discussions?discussionId="+id);
  assert.equal(notificationDestination({resource_type:"INVITATION",resource_id:id}), "/app/people");
});
test("unknown and untrusted notification resources are never rendered as links", () => {
  assert.equal(notificationDestination({resource_type:"TASK",resource_id:"javascript:alert(1)"}), null);
  assert.equal(notificationDestination({resource_type:"https://evil.example",resource_id:id}), null);
  assert.equal(notificationDestination({resource_type:"REQUEST"}), null);
  assert.equal(notificationDestination({resource_type:null}), null);
});
