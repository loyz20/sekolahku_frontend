// Shared TypeScript types and interfaces

export interface User {
  id: number;
  name: string;
  nip: string | null;
  email: string;
  duties: string[];
  primaryRole: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  nip?: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export type RegisterResponse = User;

// Duty types
export interface Duty {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface DutyAssignment {
  assignment_id: number;
  duty_code: string;
  duty_name: string;
  assigned_at: string;
  notes: string | null;
}

export interface HomeroomAssignment {
  homeroom_assignment_id: number;
  class_id: number;
  class_code: string;
  class_name: string;
  academic_year_id: number;
  academic_year_code: string;
  academic_year_name: string;
  assigned_at: string;
}

export interface UserActiveAssignments {
  duties: DutyAssignment[];
  homerooms: HomeroomAssignment[];
}

export interface AssignDutyRequest {
  userId: number;
  dutyCode: string;
  notes?: string;
}

export interface RevokeDutyRequest {
  userId: number;
  dutyCode: string;
  notes?: string;
}

export interface AssignHomeroomRequest {
  userId: number;
  classId: number;
  academicYearId: number;
  notes?: string;
}

export interface RevokeHomeroomRequest {
  classId: number;
  academicYearId: number;
  notes?: string;
}

export interface DutyAssignResponse {
  assignmentId: number;
  user: { id: number; name: string; email: string };
  duty: Duty;
  assignedBy: number;
  notes: string | null;
}

export interface DutyRevokeResponse {
  assignmentId: number;
  duty: Duty;
  revokedBy: number;
}

export interface HomeroomAssignResponse {
  homeroomAssignmentId: number;
  userDutyId: number;
  class: { id: number; code: string; name: string };
  academicYear: { id: number; code: string; name: string };
}

export interface HomeroomRevokeResponse {
  homeroomAssignmentId: number;
  revokedBy: number;
}

// Health types
export interface HealthData {
  uptime: number;
  timestamp: string;
}

// User module types
export interface UserDutyInfo {
  code: string;
  duty_name: string;
  assigned_at: string;
}

export interface UserProfile {
  id: number;
  name: string;
  nip: string | null;
  email: string;
  is_active: boolean;
  is_protected: boolean;
  duties: UserDutyInfo[];
  homerooms: HomeroomAssignment[];
  created_at: string;
  updated_at: string;
}

export interface UserListItem {
  id: number;
  name: string;
  nip: string | null;
  email: string;
  is_active: boolean;
  is_protected: boolean;
  duties: string[];
  created_at: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

export interface UpdateProfileRequest {
  name?: string;
  nip?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface ToggleStatusResponse {
  id: number;
  is_active: boolean;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  duty?: string;
}

// Settings types
export interface Setting {
  key: string;
  value: string | number | boolean | null;
  label: string;
  description?: string;
  type?: "string" | "integer" | "boolean";
  group: "school_profile" | "app_config";
  is_public?: boolean;
}

export interface UpdateSettingsRequest {
  settings: { key: string; value: string | null }[];
}

// Academic Year types
export interface AcademicYear {
  id: number;
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  semester: 1 | 2;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateAcademicYearRequest {
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  semester?: 1 | 2;
}

export interface UpdateAcademicYearRequest {
  code?: string;
  name?: string;
  start_date?: string;
  end_date?: string;
  semester?: 1 | 2;
}

export interface AcademicYearActivateResponse {
  id: number;
  code: string;
  name: string;
  semester: 1 | 2;
  is_active: boolean;
  updated_at: string;
}

export interface AcademicYearListParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Class types
export interface ClassHomeroomTeacher {
  id: number;
  name: string;
  nip: string | null;
  academic_year: {
    id: number;
    code: string;
    name: string;
  };
}

export interface ClassListItem {
  id: number;
  code: string;
  name: string;
  level: string | null;
  created_at: string;
  homeroom_teacher: ClassHomeroomTeacher | null;
}

export interface ClassHomeroomAssignment {
  id: number;
  teacher: {
    id: number;
    name: string;
    nip: string | null;
  };
  academic_year: {
    id: number;
    code: string;
    name: string;
  };
  assigned_at: string;
  ended_at: string | null;
  is_active: boolean;
  notes: string | null;
}

export interface ClassStudentEnrollment {
  id: number;
  enrollment_date: string;
  ended_date: string | null;
  is_active: boolean;
  academic_year: {
    id: number;
    code: string;
    name: string;
  };
}

export interface ClassStudentItem {
  id: number;
  nis: string;
  name: string;
  gender: "M" | "F" | null;
  email: string | null;
  is_active: boolean;
  enrollment: ClassStudentEnrollment;
}

export interface ClassDetail {
  id: number;
  code: string;
  name: string;
  level: string | null;
  created_at: string;
  updated_at: string;
  homeroom_assignments: ClassHomeroomAssignment[];
  students: ClassStudentItem[];
}

export interface CreateClassRequest {
  code: string;
  name: string;
  level?: string;
}

export interface UpdateClassRequest {
  code?: string;
  name?: string;
  level?: string | null;
}

export interface ClassListParams {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
  assigned_only?: boolean;
}

// Student types
export interface StudentListItem {
  id: number;
  nis: string;
  name: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StudentEnrollment {
  id: number;
  class: {
    id: number;
    code: string;
    name: string;
    level: string | null;
  };
  academic_year: {
    id: number;
    code: string;
    name: string;
  };
  enrollment_date: string;
  ended_date: string | null;
  is_active: boolean;
}

export interface StudentDetail {
  id: number;
  nis: string;
  name: string;
  place_of_birth: string | null;
  date_of_birth: string | null;
  gender: "M" | "F" | null;
  address: string | null;
  parent_phone: string | null;
  email: string | null;
  user_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  enrollments: StudentEnrollment[];
}

export interface CreateStudentRequest {
  nis: string;
  name: string;
  place_of_birth?: string;
  date_of_birth?: string;
  gender?: "M" | "F";
  address?: string;
  parent_phone?: string;
  email?: string;
  user_id?: number | null;
}

export interface UpdateStudentRequest {
  nis?: string;
  name?: string;
  place_of_birth?: string | null;
  date_of_birth?: string | null;
  gender?: "M" | "F" | null;
  address?: string | null;
  parent_phone?: string | null;
  email?: string | null;
}

export interface StudentListParams {
  page?: number;
  limit?: number;
  search?: string;
  class_id?: number;
  academic_year_id?: number;
}

export interface EnrollStudentRequest {
  class_id: number;
  academic_year_id: number;
}

export interface EnrollStudentResponse {
  id: number;
  student_id: number;
  class: {
    id: number;
    name: string;
  };
  academic_year: {
    id: number;
    name: string;
  };
  enrollment_date: string;
}

export interface ToggleStudentStatusResponse {
  id: number;
  is_active: boolean;
  updated_at: string;
}

// Teacher types
export interface TeacherListItem {
  id: number;
  nip: string;
  name: string;
  email: string | null;
  specialization: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TeacherDetail {
  id: number;
  nip: string;
  name: string;
  place_of_birth: string | null;
  date_of_birth: string | null;
  gender: "M" | "F" | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  qualification: string | null;
  user_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  duties: UserDutyInfo[];
  homerooms: HomeroomAssignment[];
}

export interface CreateTeacherRequest {
  nip: string;
  name: string;
  place_of_birth?: string;
  date_of_birth?: string;
  gender?: "M" | "F";
  address?: string;
  phone?: string;
  email?: string;
  specialization?: string;
  qualification?: string;
  user_id?: number | null;
}

export interface UpdateTeacherRequest {
  nip?: string;
  name?: string;
  place_of_birth?: string | null;
  date_of_birth?: string | null;
  gender?: "M" | "F" | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  specialization?: string | null;
  qualification?: string | null;
  user_id?: number | null;
}

export interface TeacherListParams {
  page?: number;
  limit?: number;
  search?: string;
  specialization?: string;
}

export interface ToggleTeacherStatusResponse {
  id: number;
  is_active: boolean;
  updated_at: string;
}

// Subject (Mata Pelajaran) types
export interface SubjectListItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SubjectDetail {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSubjectRequest {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateSubjectRequest {
  code?: string;
  name?: string;
  description?: string | null;
}

export interface SubjectListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ToggleSubjectStatusResponse {
  id: number;
  is_active: boolean;
  updated_at: string;
}

// Schedule types (Jadwal)
export interface ClassSubjectMapping {
  id: number;
  class: { id: number; code: string; name: string };
  subject: { id: number; code: string; name: string };
  academic_year: { id: number; code: string; name: string };
  assigned_at: string;
  ended_at: string | null;
  is_active: boolean;
}

export interface TeachingAssignment {
  id: number;
  class_subject_id: number;
  teacher: { id: number; name: string; nip: string };
  class: { id: number; code: string; name: string };
  subject: { id: number; code: string; name: string };
  academic_year: { id: number; code: string; name: string };
  assigned_at: string;
  ended_at: string | null;
  is_active: boolean;
  notes?: string;
}

export interface ScheduleSlot {
  id: number;
  teaching_assignment_id?: number;
  day_of_week: number; // 1-7 (Mon-Sun)
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
  room: string | null;
  notes: string | null;
  subject?: { id: number; code: string; name: string };
  teacher?: { id: number; name: string; nip: string };
  class?: { id: number; code: string; name: string };
}

export interface ClassScheduleView {
  success: boolean;
  message: string;
  data: {
    class: { id: number; code: string; name: string };
    academic_year: { id: number; code: string; name: string };
    slots: ScheduleSlot[];
  };
}

export interface TeacherScheduleView {
  success: boolean;
  message: string;
  data: {
    teacher: { id: number; name: string; nip: string };
    academic_year: { id: number; code: string; name: string };
    slots: ScheduleSlot[];
  };
}

export interface StudentScheduleView {
  success: boolean;
  message: string;
  data: {
    student: { id: number; nis: string; name: string };
    academic_year: { id: number; code: string; name: string };
    slots: ScheduleSlot[];
  };
}

export interface CreateClassSubjectRequest {
  class_id: number;
  subject_id: number;
  academic_year_id: number;
  notes?: string;
}

export interface CreateTeachingAssignmentRequest {
  class_subject_id: number;
  teacher_id: number;
  notes?: string;
}

export interface CreateScheduleSlotRequest {
  teaching_assignment_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  notes?: string;
}

export interface UpdateScheduleSlotRequest {
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  room?: string | null;
  notes?: string | null;
}

export interface ClassSubjectListParams {
  page?: number;
  limit?: number;
  class_id?: number;
  academic_year_id?: number;
  subject_id?: number;
  include_inactive?: boolean;
}

export interface TeachingAssignmentListParams {
  page?: number;
  limit?: number;
  class_id?: number;
  academic_year_id?: number;
  teacher_id?: number;
  include_inactive?: boolean;
}

// Assessment & Score types
export interface AssessmentItem {
  id: number;
  nama_penilaian: string;
  bobot: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  teacher: {
    id: number;
    name: string;
    nip: string | null;
  } | null;
}

export interface AssessmentListParams {
  page?: number;
  limit?: number;
  search?: string;
  nama_penilaian?: string;
  teacher_id?: number;
  is_active?: boolean;
}

export interface CreateAssessmentRequest {
  nama_penilaian: string;
  bobot: number;
  description?: string;
  teacher_id?: number;
}

export interface UpdateAssessmentRequest {
  nama_penilaian?: string;
  bobot?: number;
  description?: string | null;
  is_active?: boolean;
}

export interface ScoreItem {
  id: number;
  student: {
    id: number;
    nis: string;
    name: string;
  };
  subject: {
    id: number;
    code: string;
    name: string;
  };
  assessment: {
    id: number;
    nama_penilaian: string;
    bobot: number;
  };
  academic_year: {
    id: number;
    code: string;
    name: string;
  };
  nilai: number;
  created_at: string;
  updated_at?: string;
}

export interface ScoreListParams {
  page?: number;
  limit?: number;
  student_id?: number;
  subject_id?: number;
  assessment_id?: number;
  academic_year_id?: number;
}

export interface CreateScoreRequest {
  student_id: number;
  subject_id: number;
  assessment_id: number;
  academic_year_id: number;
  nilai: number;
}

export interface UpdateScoreRequest {
  nilai: number;
}
