import api from "@/api";
import type { ApiResponse, HealthData } from "@/types";

export const healthService = {
  async check() {
    const res = await api.get<ApiResponse<HealthData>>("/v1/health");
    return res.data;
  },
};
