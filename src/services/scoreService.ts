import api from "@/api";
import type {
  ApiResponse,
  CreateScoreRequest,
  PaginatedResponse,
  ScoreItem,
  ScoreListParams,
  UpdateScoreRequest,
} from "@/types";

export const scoreService = {
  async list(params?: ScoreListParams) {
    const res = await api.get<PaginatedResponse<ScoreItem>>("/v1/scores", { params });
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<ApiResponse<ScoreItem>>(`/v1/scores/${id}`);
    return res.data;
  },

  async create(data: CreateScoreRequest) {
    const res = await api.post<ApiResponse<ScoreItem>>("/v1/scores", data);
    return res.data;
  },

  async update(id: number, data: UpdateScoreRequest) {
    const res = await api.patch<ApiResponse<ScoreItem>>(`/v1/scores/${id}`, data);
    return res.data;
  },

  async delete(id: number) {
    const res = await api.delete<ApiResponse<null>>(`/v1/scores/${id}`);
    return res.data;
  },
};
