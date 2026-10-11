const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

let csrfTokenPromise = null;

function getCsrfToken() {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch(API_BASE_URL + "/auth/csrf", {
      credentials: "include",
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.data?.csrfToken) {
          throw new Error(
            data?.error?.message || "Unable to establish a secure session."
          );
        }

        return data.data.csrfToken;
      })
      .catch((error) => {
        csrfTokenPromise = null;
        throw error;
      });
  }

  return csrfTokenPromise;
}

async function apiRequest(path, options = {}, retryOnCsrfFailure = true) {
  const method = (options.method || "GET").toUpperCase();
  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(method);
  const headers = new Headers(options.headers || {});

  if (
    options.body != null &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (isMutation && !headers.has("X-CSRF-Token")) {
    headers.set("X-CSRF-Token", await getCsrfToken());
  }

  const response = await fetch(API_BASE_URL + path, {
    ...options,
    credentials: "include",
    headers,
  });

  const contentType = response.headers.get("content-type");
  const data = contentType?.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    if (
      isMutation &&
      retryOnCsrfFailure &&
      response.status === 403 &&
      data?.error?.code === "CSRF_TOKEN_INVALID"
    ) {
      csrfTokenPromise = null;
      return apiRequest(path, options, false);
    }

    if (
      response.status === 401 &&
      path !== "/auth/login" &&
      path !== "/auth/me"
    ) {
      window.dispatchEvent(new Event("manageos:session-expired"));
    }

    const error = new Error(
      data?.error?.message ||
        data?.message ||
        "Something went wrong with the request."
    );

    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function get(path, options = {}) {
  return apiRequest(path, { ...options, method: "GET" });
}

export function getCurrentUser() {
  return get("/auth/me");
}

export function post(path, body, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function put(path, body, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function patch(path, body, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function upload(path, formData, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "POST",
    body: formData,
  });
}

export function del(path, options = {}) {
  return apiRequest(path, { ...options, method: "DELETE" });
}

export { API_BASE_URL };
