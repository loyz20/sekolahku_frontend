import api from "@/api";
import type {
  ClassSubjectMapping,
  ClassSubjectListParams,
  CreateClassSubjectRequest,
  CreateTeachingAssignmentRequest,
  StudentScheduleView,
  TeacherScheduleView,
  TeachingAssignment,
  TeachingAssignmentListParams,
  ClassScheduleView,
} from "@/types";

const ENDPOINT = "/v1/schedules";

export const scheduleService = {
  // Schedule Views
  getClassSchedule: async (classId: number, academicYearId: number) => {
    const response = await api.get<ClassScheduleView>(
      `${ENDPOINT}/classes/${classId}/by-year/${academicYearId}`
    );
    return response.data;
  },

  getTeacherSchedule: async (teacherId: number, academicYearId: number) => {
    const response = await api.get<TeacherScheduleView>(
      `${ENDPOINT}/teachers/${teacherId}/by-year/${academicYearId}`
    );
    return response.data;
  },

  getStudentSchedule: async (studentId: number, academicYearId: number) => {
    const response = await api.get<StudentScheduleView>(
      `${ENDPOINT}/students/${studentId}/by-year/${academicYearId}`
    );
    return response.data;
  },

  // Class-Subject Management
  listClassSubjects: async (params?: ClassSubjectListParams) => {
    const response = await api.get<{
      success: boolean;
      message: string;
      data: ClassSubjectMapping[];
      meta: { page: number; limit: number; total: number };
    }>(`${ENDPOINT}/class-subjects`, { params });
    return response.data;
  },

  createClassSubject: async (data: CreateClassSubjectRequest) => {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: ClassSubjectMapping;
    }>(`${ENDPOINT}/class-subjects`, data);
    return response.data;
  },

  revokeClassSubject: async (classSubjectId: number) => {
    const response = await api.post<{
      success: boolean;
      message: string;
    }>(`${ENDPOINT}/class-subjects/${classSubjectId}/revoke`);
    return response.data;
  },

  deleteClassSubject: async (classSubjectId: number) => {
    const response = await api.delete<{
      success: boolean;
      message: string;
      data: { classSubjectId: number };
    }>(`${ENDPOINT}/class-subjects/${classSubjectId}`);
    return response.data;
  },

  // Teaching Assignment Management
  listTeachingAssignments: async (params?: TeachingAssignmentListParams) => {
    const response = await api.get<{
      success: boolean;
      message: string;
      data: TeachingAssignment[];
      meta: { page: number; limit: number; total: number };
    }>(`${ENDPOINT}/teaching-assignments`, { params });
    return response.data;
  },

  createTeachingAssignment: async (data: CreateTeachingAssignmentRequest) => {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: TeachingAssignment;
    }>(`${ENDPOINT}/teaching-assignments`, data);
    return response.data;
  },

  revokeTeachingAssignment: async (teachingAssignmentId: number) => {
    const response = await api.post<{
      success: boolean;
      message: string;
    }>(`${ENDPOINT}/teaching-assignments/${teachingAssignmentId}/revoke`);
    return response.data;
  },

  deleteTeachingAssignment: async (teachingAssignmentId: number) => {
    const response = await api.delete<{
      success: boolean;
      message: string;
      data: { assignmentId: number };
    }>(`${ENDPOINT}/teaching-assignments/${teachingAssignmentId}`);
    return response.data;
  },

};
