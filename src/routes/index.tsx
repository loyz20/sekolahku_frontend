import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute, GuestRoute } from "./guards";
import { DashboardLayout } from "@/components/layout/RootLayout";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const DutyManagementPage = lazy(() => import("@/pages/DutyManagementPage"));
const HealthStatusPage = lazy(() => import("@/pages/HealthStatusPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const UserManagementPage = lazy(() => import("@/pages/UserManagementPage"));
const UserDetailPage = lazy(() => import("@/pages/UserDetailPage"));
const ClassManagementPage = lazy(() => import("@/pages/ClassManagementPage"));
const ClassDetailPage = lazy(() => import("@/pages/ClassDetailPage"));
const StudentManagementPage = lazy(() => import("@/pages/StudentManagementPage"));
const StudentDetailPage = lazy(() => import("@/pages/StudentDetailPage"));
const TeacherManagementPage = lazy(() => import("@/pages/TeacherManagementPage"));
const TeacherDetailPage = lazy(() => import("@/pages/TeacherDetailPage"));
const SubjectManagementPage = lazy(() => import("@/pages/SubjectManagementPage"));
const SubjectDetailPage = lazy(() => import("@/pages/SubjectDetailPage"));
const ScoreManagementPage = lazy(() => import("@/pages/ScoreManagementPage"));
const AttendanceMeetingPage = lazy(() => import("@/pages/AttendanceMeetingPage"));
const AttendanceReportPage = lazy(() => import("@/pages/AttendanceReportPage"));
const ViolationManagementPage = lazy(() => import("@/pages/ViolationManagementPage"));
const ViolationTypeManagementPage = lazy(() => import("@/pages/ViolationTypeManagementPage"));

const withSuspense = (node: ReactNode) => (
  <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading...</div>}>
    {node}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    element: withSuspense(<GuestRoute />),
    children: [
      { path: "/login", element: withSuspense(<LoginPage />) },
      { path: "/register", element: withSuspense(<RegisterPage />) },
    ],
  },
  {
    element: withSuspense(<ProtectedRoute />),
    children: [
      {
        element: withSuspense(<DashboardLayout />),
        children: [
          { path: "/", element: withSuspense(<DashboardPage />) },
          { path: "/pengguna", element: withSuspense(<UserManagementPage />) },
          { path: "/pengguna/:id", element: withSuspense(<UserDetailPage />) },
          { path: "/tugas", element: withSuspense(<DutyManagementPage />) },
          { path: "/siswa", element: withSuspense(<StudentManagementPage />) },
          { path: "/siswa/:id", element: withSuspense(<StudentDetailPage />) },
          { path: "/guru", element: withSuspense(<TeacherManagementPage />) },
          { path: "/guru/:id", element: withSuspense(<TeacherDetailPage />) },
          { path: "/mapel", element: withSuspense(<SubjectManagementPage />) },
          { path: "/mapel/:id", element: withSuspense(<SubjectDetailPage />) },
          { path: "/nilai", element: withSuspense(<ScoreManagementPage />) },
          { path: "/absensi", element: withSuspense(<AttendanceMeetingPage />) },
          { path: "/absensi/laporan", element: withSuspense(<AttendanceReportPage />) },
          { path: "/pelanggaran", element: withSuspense(<ViolationManagementPage />) },
          { path: "/pelanggaran/master", element: withSuspense(<ViolationTypeManagementPage />) },
          { path: "/kelas", element: withSuspense(<ClassManagementPage />) },
          { path: "/kelas/:id", element: withSuspense(<ClassDetailPage />) },
          { path: "/profil", element: withSuspense(<ProfilePage />) },
          { path: "/pengaturan", element: withSuspense(<SettingsPage />) },
          { path: "/health", element: withSuspense(<HealthStatusPage />) },
        ],
      },
    ],
  },
]);
