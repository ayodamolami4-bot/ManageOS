const { createR2Store } = require("./r2Storage");
const { createConfiguredSupabaseStore } = require("./supabaseStorage");

// Keep local files only for development and tests. Cloud hosting has an
// ephemeral filesystem, so production needs an explicitly configured provider.
function storageMode(env = process.env) {
  const mode = env.FILE_STORAGE_BACKEND ||
    (env.NODE_ENV === "production" ? "supabase" : "local");

  if (!["local", "supabase", "r2"].includes(mode) ||
    (env.NODE_ENV === "production" && mode === "local")) {
    throw new Error("FILE_STORAGE_NOT_CONFIGURED");
  }
  return mode;
}

function configuredStore(env = process.env) {
  const mode = storageMode(env);
  if (mode === "local") return null;
  if (mode === "supabase") return createConfiguredSupabaseStore(env);
  return createR2Store({
    accountId: env.R2_ACCOUNT_ID,
    bucket: env.R2_BUCKET,
    token: env.R2_API_TOKEN
  });
}

module.exports = { storageMode, configuredStore };
