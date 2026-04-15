import api from "@/api";
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/types";

export const authService = {
  async login(data: LoginRequest) {
    const response = await api.post<ApiResponse<LoginResponse>>(
      "/v1/auth/login",
      data
    );
    return response.data;
  },

  async register(data: RegisterRequest) {
    const response = await api.post<ApiResponse<RegisterResponse>>(
      "/v1/auth/register",
      data
    );
    return response.data;
  },
};
