import api from "@/api";
import type {
  ApiResponse,
  UserProfile,
  UserListItem,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ToggleStatusResponse,
  UserListParams,
  PaginatedResponse,
} from "@/types";

export const userService = {
  // Own profile
  async getProfile() {
    const res = await api.get<ApiResponse<UserProfile>>("/v1/users/me");
    return res.data;
  },

  async updateProfile(data: UpdateProfileRequest) {
    const res = await api.patch<ApiResponse<UserProfile>>("/v1/users/me", data);
    return res.data;
  },

  async changePassword(data: ChangePasswordRequest) {
    const res = await api.patch<ApiResponse<null>>(
      "/v1/users/me/password",
      data
    );
    return res.data;
  },

  // Admin user management
  async listUsers(params?: UserListParams) {
    const res = await api.get<PaginatedResponse<UserListItem>>("/v1/users", {
      params,
    });
    return res.data;
  },

  async getUser(id: number) {
    const res = await api.get<ApiResponse<UserProfile>>(`/v1/users/${id}`);
    return res.data;
  },

  async updateUser(id: number, data: UpdateProfileRequest) {
    const res = await api.patch<ApiResponse<UserProfile>>(
      `/v1/users/${id}`,
      data
    );
    return res.data;
  },

  async resetPassword(id: number, data: ResetPasswordRequest) {
    const res = await api.patch<ApiResponse<null>>(
      `/v1/users/${id}/password`,
      data
    );
    return res.data;
  },

  async toggleStatus(id: number) {
    const res = await api.patch<ApiResponse<ToggleStatusResponse>>(
      `/v1/users/${id}/status`
    );
    return res.data;
  },

  async deleteUser(id: number) {
    const res = await api.delete<ApiResponse<null>>(`/v1/users/${id}`);
    return res.data;
  },
};
