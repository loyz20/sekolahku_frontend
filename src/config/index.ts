const DEFAULT_API_BASE_URL = "http://localhost:8000/api";
const DEFAULT_API_TIMEOUT_MS = 15000;

const normalizeUrl = (url: string) => url.replace(/\/+$/, "");

const parseTimeout = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_API_TIMEOUT_MS;
};

const resolvedApiBaseUrl = normalizeUrl(
  import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
);

export const API_CONFIG = {
  baseUrl: resolvedApiBaseUrl,
  timeoutMs: parseTimeout(import.meta.env.VITE_API_TIMEOUT_MS),
} as const;

export const APP_CONFIG = {
  appName: "Sekolahku",
  apiBaseUrl: API_CONFIG.baseUrl,
} as const;
