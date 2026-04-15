import api from "@/api";
import type {
  ApiResponse,
  AssessmentItem,
  AssessmentListParams,
  CreateAssessmentRequest,
  PaginatedResponse,
  UpdateAssessmentRequest,
} from "@/types";

export const assessmentService = {
  async list(params?: AssessmentListParams) {
    const res = await api.get<PaginatedResponse<AssessmentItem>>(
      "/v1/assessments",
      { params }
    );
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<ApiResponse<AssessmentItem>>(`/v1/assessments/${id}`);
    return res.data;
  },

  async create(data: CreateAssessmentRequest) {
    const res = await api.post<ApiResponse<AssessmentItem>>("/v1/assessments", data);
    return res.data;
  },

  async update(id: number, data: UpdateAssessmentRequest) {
    const res = await api.patch<ApiResponse<AssessmentItem>>(
      `/v1/assessments/${id}`,
      data
    );
    return res.data;
  },

  async delete(id: number) {
    const res = await api.delete<ApiResponse<null>>(`/v1/assessments/${id}`);
    return res.data;
  },
};
