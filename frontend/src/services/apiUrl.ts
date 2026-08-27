export function getApiUrl(): string {
  if (import.meta.env.DEV) {
    return 'http://localhost:8000';
  }

  const configuredUrl = import.meta.env.VITE_API_URL?.trim();

  if (!configuredUrl) {
    throw new Error('VITE_API_URL is not configured. Set it to the deployed backend URL.');
  }

  // Accept a Markdown link pasted from deployment notes, but keep only its URL.
  const markdownLink = configuredUrl.match(/^\[[^\]]+\]\((https?:\/\/[^)\s]+)\)$/);
  const normalizedUrl = (markdownLink?.[1] ?? configuredUrl)
    .replace(/[?#].*$/, '')
    .replace(/\/predict\/?$/i, '')
    .replace(/\/+$/, '');

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    throw new Error('VITE_API_URL must be a plain absolute backend URL, for example https://your-backend.ngrok-free.dev.');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('VITE_API_URL must use HTTP or HTTPS.');
  }

  if (!import.meta.env.DEV && /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedUrl)) {
    throw new Error('VITE_API_URL points to localhost in a production build. Set it to a public HTTPS backend URL.');
  }

  return normalizedUrl;
}