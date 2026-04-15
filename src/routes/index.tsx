import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute, GuestRoute } from "./guards";
import { DashboardLayout } from "@/components/layout/RootLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import DutyManagementPage from "@/pages/DutyManagementPage";
import HealthStatusPage from "@/pages/HealthStatusPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import UserManagementPage from "@/pages/UserManagementPage";
import UserDetailPage from "@/pages/UserDetailPage";
import ClassManagementPage from "@/pages/ClassManagementPage";
import ClassDetailPage from "@/pages/ClassDetailPage";
import StudentManagementPage from "@/pages/StudentManagementPage";
import StudentDetailPage from "@/pages/StudentDetailPage";
import TeacherManagementPage from "@/pages/TeacherManagementPage";
import TeacherDetailPage from "@/pages/TeacherDetailPage";
import SubjectManagementPage from "@/pages/SubjectManagementPage";
import SubjectDetailPage from "@/pages/SubjectDetailPage";
import ScheduleManagementPage from "@/pages/ScheduleManagementPage";
import ClassSubjectManagementPage from "@/pages/ClassSubjectManagementPage";
import TeachingAssignmentPage from "@/pages/TeachingAssignmentPage";
import ScoreManagementPage from "@/pages/ScoreManagementPage";

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/pengguna", element: <UserManagementPage /> },
          { path: "/pengguna/:id", element: <UserDetailPage /> },
          { path: "/tugas", element: <DutyManagementPage /> },
          { path: "/siswa", element: <StudentManagementPage /> },
          { path: "/siswa/:id", element: <StudentDetailPage /> },
          { path: "/guru", element: <TeacherManagementPage /> },
          { path: "/guru/:id", element: <TeacherDetailPage /> },
          { path: "/mapel", element: <SubjectManagementPage /> },
          { path: "/mapel/:id", element: <SubjectDetailPage /> },
          { path: "/nilai", element: <ScoreManagementPage /> },
          { path: "/kelas", element: <ClassManagementPage /> },
          { path: "/kelas/:id", element: <ClassDetailPage /> },
          { path: "/jadwal", element: <ScheduleManagementPage /> },
          { path: "/jadwal/class-subjects", element: <ClassSubjectManagementPage /> },
          { path: "/jadwal/teaching-assignments", element: <TeachingAssignmentPage /> },
          { path: "/profil", element: <ProfilePage /> },
          { path: "/pengaturan", element: <SettingsPage /> },
          { path: "/health", element: <HealthStatusPage /> },
        ],
      },
    ],
  },
]);
