import api from "@/api";
import type { ApiResponse, Setting, UpdateSettingsRequest } from "@/types";

export const settingsService = {
  async getPublicSettings(group?: string) {
    const res = await api.get<ApiResponse<Setting[]>>("/v1/settings/public", {
      params: group ? { group } : undefined,
    });
    return res.data;
  },

  async getSettings(group?: string) {
    const res = await api.get<ApiResponse<Setting[]>>("/v1/settings", {
      params: group ? { group } : undefined,
    });
    return res.data;
  },

  async updateSettings(data: UpdateSettingsRequest) {
    const res = await api.patch<ApiResponse<Setting[]>>("/v1/settings", data);
    return res.data;
  },
};
