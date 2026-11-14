const API_BASE_URL = "/api";

export async function apiGet(path, { signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`خطا در دریافت اطلاعات؛ کد ${response.status}`);
  }

  return response.json();
}
