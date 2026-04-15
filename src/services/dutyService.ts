import api from "@/api";
import type {
  ApiResponse,
  Duty,
  AssignDutyRequest,
  RevokeDutyRequest,
  AssignHomeroomRequest,
  RevokeHomeroomRequest,
  DutyAssignResponse,
  DutyRevokeResponse,
  HomeroomAssignResponse,
  HomeroomRevokeResponse,
  UserActiveAssignments,
  PaginatedResponse,
} from "@/types";

export const dutyService = {
  async list(params?: { page?: number; limit?: number }) {
    const res = await api.get<PaginatedResponse<Duty>>("/v1/duties", {
      params,
    });
    return res.data;
  },

  async assignDuty(data: AssignDutyRequest) {
    const res = await api.post<ApiResponse<DutyAssignResponse>>(
      "/v1/duties/assign",
      data
    );
    return res.data;
  },

  async revokeDuty(data: RevokeDutyRequest) {
    const res = await api.post<ApiResponse<DutyRevokeResponse>>(
      "/v1/duties/revoke",
      data
    );
    return res.data;
  },

  async assignHomeroom(data: AssignHomeroomRequest) {
    const res = await api.post<ApiResponse<HomeroomAssignResponse>>(
      "/v1/duties/homeroom/assign",
      data
    );
    return res.data;
  },

  async revokeHomeroom(data: RevokeHomeroomRequest) {
    const res = await api.post<ApiResponse<HomeroomRevokeResponse>>(
      "/v1/duties/homeroom/revoke",
      data
    );
    return res.data;
  },

  async getUserActiveDuties(userId: number) {
    const res = await api.get<ApiResponse<UserActiveAssignments>>(
      `/v1/duties/users/${userId}/active`
    );
    return res.data;
  },
};
