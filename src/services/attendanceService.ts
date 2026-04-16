import api from "@/api";
import type {
  ApiResponse,
  AttendanceMeetingDetail,
  AttendanceMeetingListItem,
  AttendanceMeetingListParams,
  CreateAttendanceMeetingRequest,
  PaginatedResponse,
  UpdateAttendanceMeetingRequest,
  UpsertMeetingAttendanceRequest,
} from "@/types";

const ENDPOINT = "/v1/attendances";

export const attendanceService = {
  async listMeetings(params?: AttendanceMeetingListParams) {
    const res = await api.get<PaginatedResponse<AttendanceMeetingListItem>>(
      `${ENDPOINT}/meetings`,
      { params }
    );
    return res.data;
  },

  async getMeetingById(id: number) {
    const res = await api.get<ApiResponse<AttendanceMeetingDetail>>(
      `${ENDPOINT}/meetings/${id}`
    );
    return res.data;
  },

  async createMeeting(data: CreateAttendanceMeetingRequest) {
    const res = await api.post<ApiResponse<AttendanceMeetingDetail>>(
      `${ENDPOINT}/meetings`,
      data
    );
    return res.data;
  },

  async updateMeeting(id: number, data: UpdateAttendanceMeetingRequest) {
    const res = await api.patch<ApiResponse<AttendanceMeetingDetail>>(
      `${ENDPOINT}/meetings/${id}`,
      data
    );
    return res.data;
  },

  async upsertMeetingAttendance(id: number, data: UpsertMeetingAttendanceRequest) {
    const res = await api.put<ApiResponse<AttendanceMeetingDetail>>(
      `${ENDPOINT}/meetings/${id}/attendance`,
      data
    );
    return res.data;
  },

  async deleteMeeting(id: number) {
    const res = await api.delete<ApiResponse<null>>(`${ENDPOINT}/meetings/${id}`);
    return res.data;
  },
};
