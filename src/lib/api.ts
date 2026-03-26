const apiBaseURL = (import.meta.env.PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

export function buildClientApiUrl(path: string): string {
  return apiBaseURL ? `${apiBaseURL}${path}` : path;
}

export function buildServerApiUrl(path: string, currentUrl: URL): string {
  return apiBaseURL ? `${apiBaseURL}${path}` : new URL(path, currentUrl).toString();
}

export const API_BASE_URL = apiBaseURL;
