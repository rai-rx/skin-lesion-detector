export function getApiUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL?.trim();

  if (!apiUrl) {
    throw new Error('VITE_API_URL is not configured. Set it to the deployed backend URL.');
  }

  if (!import.meta.env.DEV && /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/i.test(apiUrl)) {
    throw new Error('VITE_API_URL points to localhost in a production build. Set it to a public HTTPS backend URL.');
  }

  return apiUrl.replace(/\/+$/, '');
}