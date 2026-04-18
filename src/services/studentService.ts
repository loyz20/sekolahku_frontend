import api from "@/api";
import type {
  ApiResponse,
  StudentListItem,
  StudentDetail,
  CreateStudentRequest,
  UpdateStudentRequest,
  StudentListParams,
  EnrollStudentRequest,
  EnrollStudentResponse,
  ToggleStudentStatusResponse,
  PaginatedResponse,
} from "@/types";

export const studentService = {
  async list(params?: StudentListParams) {
    const res = await api.get<PaginatedResponse<StudentListItem>>(
      "/v1/students",
      { params }
    );
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<ApiResponse<StudentDetail>>(`/v1/students/${id}`);
    return res.data;
  },

  async create(data: CreateStudentRequest) {
    const res = await api.post<ApiResponse<StudentDetail>>("/v1/students", data);
    return res.data;
  },

  async update(id: number, data: UpdateStudentRequest) {
    const res = await api.patch<ApiResponse<StudentDetail>>(
      `/v1/students/${id}`,
      data
    );
    return res.data;
  },

  async toggleStatus(id: number) {
    const res = await api.patch<ApiResponse<ToggleStudentStatusResponse>>(
      `/v1/students/${id}/status`
    );
    return res.data;
  },

  async delete(id: number) {
    const res = await api.delete<ApiResponse<null>>(`/v1/students/${id}`);
    return res.data;
  },

  async enroll(studentId: number, data: EnrollStudentRequest) {
    const res = await api.post<ApiResponse<EnrollStudentResponse>>(
      `/v1/students/${studentId}/enrollments`,
      data
    );
    return res.data;
  },

  async disenroll(studentId: number, enrollmentId: number) {
    const res = await api.delete<ApiResponse<null>>(
      `/v1/students/${studentId}/enrollments/${enrollmentId}`
    );
    return res.data;
  },

  async import(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post<ApiResponse<any>>('/v1/students/import', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async downloadImportTemplate() {
    const res = await api.get('/v1/students/import/template/download', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Template_Import_Siswa.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
