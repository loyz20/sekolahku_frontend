import api from "@/api";
import type {
  ApiResponse,
  TeacherListItem,
  TeacherDetail,
  CreateTeacherRequest,
  UpdateTeacherRequest,
  TeacherListParams,
  ToggleTeacherStatusResponse,
  PaginatedResponse,
} from "@/types";

export const teacherService = {
  async list(params?: TeacherListParams) {
    const res = await api.get<PaginatedResponse<TeacherListItem>>(
      "/v1/teachers",
      { params }
    );
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<ApiResponse<TeacherDetail>>(`/v1/teachers/${id}`);
    return res.data;
  },

  async create(data: CreateTeacherRequest) {
    const res = await api.post<ApiResponse<TeacherDetail>>("/v1/teachers", data);
    return res.data;
  },

  async update(id: number, data: UpdateTeacherRequest) {
    const res = await api.patch<ApiResponse<TeacherDetail>>(
      `/v1/teachers/${id}`,
      data
    );
    return res.data;
  },

  async toggleStatus(id: number) {
    const res = await api.patch<ApiResponse<ToggleTeacherStatusResponse>>(
      `/v1/teachers/${id}/status`
    );
    return res.data;
  },

  async delete(id: number) {
    const res = await api.delete<ApiResponse<null>>(`/v1/teachers/${id}`);
    return res.data;
  },

  async import(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post<ApiResponse<{ created: number; errors: Array<{ row: number; error: string }> }>>(
      "/v1/teachers/import",
      fd,
      undefined
    );
    return res.data;
  },

  async downloadImportTemplate() {
    const res = await api.get('/v1/teachers/import/template/download', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Template_Import_Guru.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
