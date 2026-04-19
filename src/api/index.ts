import axios from "axios";
import { API_CONFIG } from "@/config";

const api = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeoutMs,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const selectedAcademicYearId = localStorage.getItem("selectedAcademicYearId");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (selectedAcademicYearId) {
    config.headers["X-Academic-Year-Id"] = selectedAcademicYearId;
  }

  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
