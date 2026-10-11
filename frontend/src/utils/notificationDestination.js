// Route only known resource types. Never turn server-provided values
// into arbitrary URLs, origins, or filesystem paths.
export function notificationDestination(notification) {
  const type = String(notification?.resource_type || "").toUpperCase();
  const id = String(notification?.resource_id || "");
  const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  switch (type) {
    case "TASK":
      return validId ? "/app/work?taskId=" + encodeURIComponent(id) : null;
    case "PROJECT":
      return validId ? "/app/projects/" + encodeURIComponent(id) : null;
    case "REQUEST":
      return validId ? "/app/updates?requestId=" + encodeURIComponent(id) : null;
    case "DISCUSSION":
      return validId ? "/app/discussions?discussionId=" + encodeURIComponent(id) : null;
    case "GOAL":
      return "/app/goals";
    case "FILE":
      return "/app/files";
    case "INVITATION":
    case "USER":
      return "/app/people";
    default:
      return null;
  }
}
