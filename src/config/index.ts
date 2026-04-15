export const APP_CONFIG = {
  appName: "Sekolahku",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
} as const;
