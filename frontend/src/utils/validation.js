const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const personNamePattern = /^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]*$/u;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const GOAL_STATUSES = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"];
export const PROJECT_STATUSES = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateName(value, label = "Name", max = 100) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length > max) return `${label} must be ${max} characters or fewer.`;
  if (!personNamePattern.test(trimmed)) {
    return `${label} must contain letters, not numbers or unsupported symbols.`;
  }
  return "";
}

export function validateRegistration(form) {
  const errors = {};
  const companyName = form.companyName?.trim() || "";
  if (!companyName) errors.companyName = "Company name is required.";
  else if (companyName.length > 200) errors.companyName = "Company name is too long.";

  const firstNameError = validateName(form.firstName, "First name");
  const lastNameError = validateName(form.lastName, "Last name");
  if (firstNameError) errors.firstName = firstNameError;
  if (lastNameError) errors.lastName = lastNameError;

  const email = form.email?.trim() || "";
  if (!emailPattern.test(email) || email.length > 254) {
    errors.email = "Enter a valid email address.";
  }

  const password = form.password || "";
  if (password.length < 12 || password.length > 128) {
    errors.password = "Password must contain between 12 and 128 characters.";
  }
  if (form.confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match.";
  }
  if (!form.acceptedTerms) errors.acceptedTerms = "Accept the Terms and Privacy Policy.";
  return errors;
}

export function validateWorkDraft(form, { kind = "project" } = {}) {
  const errors = {};
  const isGoal = kind === "goal";
  const titleKey = isGoal ? "title" : "name";
  const title = String(form[titleKey] || "").trim();
  if (!title) errors[titleKey] = `${isGoal ? "Goal title" : "Project name"} is required.`;
  else if (title.length > 255) errors[titleKey] = "Maximum 255 characters.";

  if (String(form.description || "").length > 10000) {
    errors.description = "Description cannot exceed 10,000 characters.";
  }
  const statuses = isGoal ? GOAL_STATUSES : PROJECT_STATUSES;
  if (!statuses.includes(form.status)) errors.status = "Choose a valid status.";
  if (!PRIORITIES.includes(form.priority)) errors.priority = "Choose a valid priority.";

  for (const field of ["startDate", "dueDate"]) {
    if (form[field] && !validDate(form[field])) {
      errors[field] = "Enter a valid calendar date.";
    }
  }

  if (
    !errors.startDate &&
    !errors.dueDate &&
    form.startDate &&
    form.dueDate &&
    form.dueDate < form.startDate
  ) {
    errors.dueDate = "Due date cannot be earlier than start date.";
  }
  return errors;
}

export function toWorkPayload(form, { kind = "project" } = {}) {
  const key = kind === "goal" ? "title" : "name";
  return {
    [key]: form[key].trim(),
    description: form.description?.trim() || null,
    status: form.status,
    priority: form.priority,
    startDate: form.startDate || null,
    dueDate: form.dueDate || null,
  };
}

export function validateUnitDraft(form) {
  const errors = {};
  const name = form.name?.trim() || "";
  const type = form.type?.trim() || "";

  if (!name) errors.name = "Unit name is required.";
  else if (name.length > 150) errors.name = "Unit name cannot exceed 150 characters.";
  if (!type) errors.type = "Unit type is required.";
  else if (type.length > 50) errors.type = "Unit type cannot exceed 50 characters.";
  if (String(form.description || "").length > 10000) {
    errors.description = "Description cannot exceed 10,000 characters.";
  }
  if (form.parentUnitId && !uuidPattern.test(form.parentUnitId)) {
    errors.parentUnitId = "Choose a valid parent organization unit.";
  }
  return errors;
}

export function apiFieldErrors(error) {
  const result = {};
  for (const issue of error?.data?.error?.details || []) {
    if (issue.field && !result[issue.field]) result[issue.field] = issue.message;
  }
  return result;
}

export function apiErrorMessage(error) {
  return (
    error?.data?.error?.message ||
    error?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}
