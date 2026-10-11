const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",

    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data = null;

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || "Something went wrong with the request."
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

export async function get(path, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "GET",
  });
}
export async function getCurrentUser() {
  return get("/auth/me");
}

export async function post(path, body, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function put(path, body, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function patch(path, body, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function del(path, options = {}) {
  return apiRequest(path, {
    ...options,
    method: "DELETE",
  });
}

export { API_BASE_URL };