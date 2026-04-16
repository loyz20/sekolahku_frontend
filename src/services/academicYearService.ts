import api from "@/api";
import type {
  ApiResponse,
  AcademicYear,
  CreateAcademicYearRequest,
  UpdateAcademicYearRequest,
  AcademicYearActivateResponse,
  AcademicYearListParams,
  PaginatedResponse,
} from "@/types";

export const academicYearService = {
  async listPublic(params?: AcademicYearListParams) {
    const res = await api.get<PaginatedResponse<AcademicYear>>(
      "/v1/academic-years/public",
      { params }
    );
    return res.data;
  },

  async list(params?: AcademicYearListParams) {
    const res = await api.get<PaginatedResponse<AcademicYear>>(
      "/v1/academic-years",
      { params }
    );
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<ApiResponse<AcademicYear>>(
      `/v1/academic-years/${id}`
    );
    return res.data;
  },

  async create(data: CreateAcademicYearRequest) {
    const res = await api.post<ApiResponse<AcademicYear>>(
      "/v1/academic-years",
      data
    );
    return res.data;
  },

  async update(id: number, data: UpdateAcademicYearRequest) {
    const res = await api.patch<ApiResponse<AcademicYear>>(
      `/v1/academic-years/${id}`,
      data
    );
    return res.data;
  },

  async activate(id: number) {
    const res = await api.patch<ApiResponse<AcademicYearActivateResponse>>(
      `/v1/academic-years/${id}/activate`
    );
    return res.data;
  },

  async delete(id: number) {
    const res = await api.delete<ApiResponse<null>>(
      `/v1/academic-years/${id}`
    );
    return res.data;
  },
};
