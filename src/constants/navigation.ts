import {
  LayoutDashboard,
  Users,
  UserCog,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardList,
  ClipboardCheck,
  Settings,
  Shield,
  Activity,
  UserCircle,
  School,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
  children?: NavItem[];
  roles?: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const sidebarNav: NavGroup[] = [
  {
    label: "Utama",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
        roles: ["admin", "guru", "kepala_sekolah", "superadmin"],
      },
    ],
  },
  {
    label: "Master Data",
    items: [
      {
        title: "Kelas",
        url: "/kelas",
        icon: School,
        roles: ["admin", "kepala_sekolah", "superadmin"],
      },
      {
        title: "Siswa",
        url: "/siswa",
        icon: GraduationCap,
        roles: ["admin", "kepala_sekolah", "superadmin"],
      },
      {
        title: "Guru",
        url: "/guru",
        icon: Users,
        roles: ["admin", "kepala_sekolah", "superadmin"],
      },
      {
        title: "Mata Pelajaran",
        url: "/mapel",
        icon: BookOpen,
        roles: ["admin", "kepala_sekolah", "superadmin"],
      },
      {
        title: "Jadwal",
        url: "/jadwal",
        icon: CalendarDays,
        roles: ["admin", "kepala_sekolah", "superadmin"],
      },
    ],
  },
  {
    label: "Akademik",
    items: [
      {
        title: "Nilai",
        url: "/nilai",
        icon: ClipboardList,
        roles: ["admin", "guru", "kepala_sekolah", "superadmin"],
      },
      {
        title: "Absensi",
        url: "/absensi",
        icon: ClipboardCheck,
        roles: ["admin", "guru", "kepala_sekolah", "superadmin"],
      },
    ],
  },
  {
    label: "Administrasi",
    items: [
      {
        title: "Pengguna",
        url: "/pengguna",
        icon: UserCog,
        roles: ["admin", "kepala_sekolah", "superadmin"],
      },
      {
        title: "Manajemen Tugas",
        url: "/tugas",
        icon: Shield,
        roles: ["admin", "kepala_sekolah"],
      },
    ],
  },
  {
    label: "Sistem",
    items: [
      {
        title: "Profil Saya",
        url: "/profil",
        icon: UserCircle,
        roles: ["admin", "guru", "kepala_sekolah", "superadmin"],
      },
      {
        title: "Pengaturan",
        url: "/pengaturan",
        icon: Settings,
        roles: ["admin", "kepala_sekolah", "superadmin"],
      },
      {
        title: "Status Server",
        url: "/health",
        icon: Activity,
        roles: ["admin", "guru", "kepala_sekolah", "superadmin"],
      },
    ],
  },
];
