const TOKEN_KEY = "shop.auth.tokens";

let refreshPromise = null;

export function readTokens() {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(TOKEN_KEY) || "null"
    );

    return value?.access && value?.refresh ? value : null;
  } catch {
    return null;
  }
}

export function saveTokens(tokens) {
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function readResponse(response) {
  if (response.status === 204) return null;

  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getErrorMessage(data) {
  if (typeof data === "string") return data;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, value]) => {
        const message = Array.isArray(value)
          ? value.join(" ")
          : String(value);

        return field === "detail" || field === "non_field_errors"
          ? message
          : `${field}: ${message}`;
      })
      .join("\n");
  }

  return "درخواست انجام نشد. دوباره تلاش کنید.";
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  const previousTokens = readTokens();

  if (!previousTokens?.refresh) return null;

  refreshPromise = (async () => {
    const response = await fetch("/api/accounts/token/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        refresh: previousTokens.refresh,
      }),
    });

    const data = await readResponse(response);

    if (readTokens()?.refresh !== previousTokens.refresh) {
      return null;
    }

    if (!response.ok || !data?.access) {
      if (response.status === 400 || response.status === 401) {
        clearTokens();
        window.dispatchEvent(new Event("shop:auth-expired"));
      }

      return null;
    }

    const nextTokens = {
      access: data.access,
      refresh: data.refresh || previousTokens.refresh,
    };

    saveTokens(nextTokens);

    return nextTokens.access;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function api(
  path,
  { method = "GET", body, auth = false, signal } = {}
) {
  async function send(access) {
    return fetch(path, {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    });
  }

  let response = await send(auth ? readTokens()?.access : null);

  if (auth && response.status === 401) {
    const access = await refreshAccessToken();

    if (access) {
      response = await send(access);
    }
  }

  const data = await readResponse(response);

  if (!response.ok) {
    const error = new Error(getErrorMessage(data));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function apiGet(path, options = {}) {
  const normalizedPath =
    path.startsWith("/api/")
      ? path
      : `/api/${path.replace(/^\/+/, "")}`;

  return api(normalizedPath, {
    ...options,
    method: "GET",
  });
}
