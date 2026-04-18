import api from "@/api";
import type {
  ApiResponse,
  CreateBulkViolationRequest,
  CreateViolationRequest,
  CreateViolationTypeRequest,
  PaginatedResponse,
  UpdateViolationRequest,
  UpdateViolationTypeRequest,
  ViolationItem,
  ViolationListParams,
  ViolationStudentItem,
  ViolationSummary,
  ViolationTypeItem,
  ViolationTypeListParams,
} from "@/types";

export const violationService = {
  async listTypes(params?: ViolationTypeListParams) {
    const res = await api.get<PaginatedResponse<ViolationTypeItem>>("/v1/violations/types", {
      params,
    });
    return res.data;
  },

  async getTypeById(id: number) {
    const res = await api.get<ApiResponse<ViolationTypeItem>>(`/v1/violations/types/${id}`);
    return res.data;
  },

  async createType(data: CreateViolationTypeRequest) {
    const res = await api.post<ApiResponse<ViolationTypeItem>>("/v1/violations/types", data);
    return res.data;
  },

  async updateType(id: number, data: UpdateViolationTypeRequest) {
    const res = await api.patch<ApiResponse<ViolationTypeItem>>(`/v1/violations/types/${id}`, data);
    return res.data;
  },

  async deleteType(id: number) {
    const res = await api.delete<ApiResponse<null>>(`/v1/violations/types/${id}`);
    return res.data;
  },

  async list(params?: ViolationListParams) {
    const res = await api.get<PaginatedResponse<ViolationItem>>("/v1/violations", {
      params,
    });
    return res.data;
  },

  async listStudents(params?: Omit<ViolationListParams, "student_id">) {
    const res = await api.get<PaginatedResponse<ViolationStudentItem>>("/v1/violations/students", {
      params,
    });
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<ApiResponse<ViolationItem>>(`/v1/violations/${id}`);
    return res.data;
  },

  async create(data: CreateViolationRequest) {
    const res = await api.post<ApiResponse<ViolationItem>>("/v1/violations", data);
    return res.data;
  },

  async createBulk(data: CreateBulkViolationRequest) {
    const res = await api.post<ApiResponse<ViolationItem[]>>("/v1/violations/bulk", data);
    return res.data;
  },

  async update(id: number, data: UpdateViolationRequest) {
    const res = await api.patch<ApiResponse<ViolationItem>>(`/v1/violations/${id}`, data);
    return res.data;
  },

  async delete(id: number) {
    const res = await api.delete<ApiResponse<null>>(`/v1/violations/${id}`);
    return res.data;
  },

  async summary(params?: Omit<ViolationListParams, "page" | "limit" | "search" | "student_id">) {
    const res = await api.get<ApiResponse<ViolationSummary>>("/v1/violations/summary", {
      params,
    });
    return res.data;
  },
};
