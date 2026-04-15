import api from "@/api";
import type {
  ApiResponse,
  ClassListItem,
  ClassDetail,
  CreateClassRequest,
  UpdateClassRequest,
  ClassListParams,
  PaginatedResponse,
} from "@/types";

export const classService = {
  async list(params?: ClassListParams) {
    const res = await api.get<PaginatedResponse<ClassListItem>>("/v1/classes", {
      params,
    });
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<ApiResponse<ClassDetail>>(`/v1/classes/${id}`);
    return res.data;
  },

  async create(data: CreateClassRequest) {
    const res = await api.post<ApiResponse<ClassDetail>>("/v1/classes", data);
    return res.data;
  },

  async update(id: number, data: UpdateClassRequest) {
    const res = await api.patch<ApiResponse<ClassDetail>>(
      `/v1/classes/${id}`,
      data
    );
    return res.data;
  },

  async delete(id: number) {
    const res = await api.delete<ApiResponse<null>>(`/v1/classes/${id}`);
    return res.data;
  },

  async import(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post<ApiResponse<{ created: number; errors: Array<{ row: number; error: string }> }>>(
      "/v1/classes/import",
      fd,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  },

  async downloadImportTemplate() {
    const res = await api.get('/v1/classes/import/template/download', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Template_Import_Kelas.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
