import api from "@/api";
import type {
  ApiResponse,
  SubjectListItem,
  SubjectDetail,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  SubjectListParams,
  ToggleSubjectStatusResponse,
  PaginatedResponse,
} from "@/types";

export const subjectService = {
  async list(params?: SubjectListParams) {
    const res = await api.get<PaginatedResponse<SubjectListItem>>(
      "/v1/subjects",
      { params }
    );
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<ApiResponse<SubjectDetail>>(
      `/v1/subjects/${id}`
    );
    return res.data;
  },

  async create(data: CreateSubjectRequest) {
    const res = await api.post<ApiResponse<SubjectDetail>>(
      "/v1/subjects",
      data
    );
    return res.data;
  },

  async update(id: number, data: UpdateSubjectRequest) {
    const res = await api.patch<ApiResponse<SubjectDetail>>(
      `/v1/subjects/${id}`,
      data
    );
    return res.data;
  },

  async toggleStatus(id: number) {
    const res = await api.patch<ApiResponse<ToggleSubjectStatusResponse>>(
      `/v1/subjects/${id}/status`
    );
    return res.data;
  },

  async delete(id: number) {
    const res = await api.delete<ApiResponse<null>>(`/v1/subjects/${id}`);
    return res.data;
  },
};
