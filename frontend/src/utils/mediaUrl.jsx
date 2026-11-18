export function mediaUrl(value) {
  if (!value || typeof value !== "string") return "";

  try {
    const url = new URL(value, window.location.origin);

    const isLocalBackend =
      url.hostname === "127.0.0.1" ||
      url.hostname === "localhost" ||
      url.hostname === "[::1]";

    if (isLocalBackend && url.pathname.startsWith("/media/")) {
      return `${url.pathname}${url.search}`;
    }

    return value;
  } catch {
    return value;
  }
}
