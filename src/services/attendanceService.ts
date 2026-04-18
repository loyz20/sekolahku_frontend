import api from "@/api";
import type {
  ApiResponse,
  AttendanceItem,
  AttendanceListParams,
  AttendanceSummary,
  BulkUpsertAttendanceRequest,
  CreateAttendanceRequest,
  PaginatedResponse,
  UpdateAttendanceRequest,
} from "@/types";

export const attendanceService = {
  async list(params?: AttendanceListParams) {
    const res = await api.get<PaginatedResponse<AttendanceItem>>("/v1/attendances", {
      params,
    });
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<ApiResponse<AttendanceItem>>(`/v1/attendances/${id}`);
    return res.data;
  },

  async create(data: CreateAttendanceRequest) {
    const res = await api.post<ApiResponse<AttendanceItem>>("/v1/attendances", data);
    return res.data;
  },

  async bulkUpsert(data: BulkUpsertAttendanceRequest) {
    const res = await api.post<
      ApiResponse<{
        upserted: number;
        subject_id: number;
        date: string;
      }>
    >("/v1/attendances/bulk-upsert", data);
    return res.data;
  },

  async update(id: number, data: UpdateAttendanceRequest) {
    const res = await api.patch<ApiResponse<AttendanceItem>>(`/v1/attendances/${id}`, data);
    return res.data;
  },

  async delete(id: number) {
    const res = await api.delete<ApiResponse<null>>(`/v1/attendances/${id}`);
    return res.data;
  },

  async summary(params?: Omit<AttendanceListParams, "page" | "limit" | "status">) {
    const res = await api.get<ApiResponse<AttendanceSummary>>("/v1/attendances/summary", {
      params,
    });
    return res.data;
  },
};
