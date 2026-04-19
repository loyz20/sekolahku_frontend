import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { useAuthStore } from "@/stores/authStore";
import { isAdminLike, isTeacherOnly } from "@/lib/roles";
import { studentService } from "@/services/studentService";
import { teacherService } from "@/services/teacherService";
import { classService } from "@/services/classService";
import { subjectService } from "@/services/subjectService";
import { attendanceService } from "@/services/attendanceService";
import { violationService } from "@/services/violationService";
import { healthService } from "@/services/healthService";
import { scoreService } from "@/services/scoreService";
import { scheduleService } from "@/services/scheduleService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  HeartPulse,
  Loader2,
  Route,
  TrendingUp,
  Users,
} from "lucide-react";

type KpiData = {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  attendanceThisMonth: number;
  violationPoints: number;
  averageScore: number | null;
  healthUptimeHours: number | null;
  activeTeacherAssignments: number;
  activeTeacherClasses: number;
};

type TrendPoint = {
  date: string;
  total: number;
  hadir: number;
};

type PiePoint = {
  key: string;
  label: string;
  value: number;
  fill: string;
};

const ATTENDANCE_STATUS_CONFIG = {
  hadir: { label: "Hadir", color: "#10b981" },
  izin: { label: "Izin", color: "#f59e0b" },
  sakit: { label: "Sakit", color: "#0ea5e9" },
  alpha: { label: "Alpha", color: "#ef4444" },
} satisfies ChartConfig;

const VIOLATION_SEVERITY_CONFIG = {
  minor: { label: "Ringan", color: "#0ea5e9" },
  moderate: { label: "Sedang", color: "#f59e0b" },
  severe: { label: "Berat", color: "#ef4444" },
} satisfies ChartConfig;

const ATTENDANCE_TREND_CONFIG = {
  hadir: { label: "Hadir", color: "#10b981" },
  total: { label: "Total Catatan", color: "#94a3b8" },
} satisfies ChartConfig;

function toYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toShortDateLabel(ymd: string) {
  return new Date(ymd).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [kpi, setKpi] = useState<KpiData>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    attendanceThisMonth: 0,
    violationPoints: 0,
    averageScore: null,
    healthUptimeHours: null,
    activeTeacherAssignments: 0,
    activeTeacherClasses: 0,
  });
  const [attendanceStatusData, setAttendanceStatusData] = useState<PiePoint[]>([]);
  const [violationSeverityData, setViolationSeverityData] = useState<PiePoint[]>([]);
  const [attendanceTrendData, setAttendanceTrendData] = useState<TrendPoint[]>([]);

  const selectedAcademicYearId = Number(localStorage.getItem("selectedAcademicYearId") || 0);
  const selectedAcademicYearName =
    localStorage.getItem("selectedAcademicYearName") || "Belum dipilih";
  const teacherOnly = isTeacherOnly(user?.duties);
  const adminLike = isAdminLike(user?.duties);

  const roleLabel = useMemo(() => {
    if (user?.duties?.includes("superadmin")) return "Superadmin";
    if (user?.duties?.includes("admin")) return "Admin";
    if (user?.duties?.includes("kepala_sekolah")) return "Kepala Sekolah";
    if (user?.duties?.includes("guru")) return "Guru";
    return "Pengguna";
  }, [user?.duties]);

  const quickActions = useMemo(() => {
    if (teacherOnly) {
      return [
        { label: "Input Absensi", href: "/absensi" },
        { label: "Kelola Nilai", href: "/nilai" },
        { label: "Pelanggaran", href: "/pelanggaran" },
      ];
    }

    return [
      { label: "Manajemen Siswa", href: "/siswa" },
      { label: "Manajemen Guru", href: "/guru" },
      { label: "Absensi Siswa", href: "/absensi" },
    ];
  }, [teacherOnly]);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);

      const [
        studentsRes,
        teachersRes,
        classesRes,
        subjectsRes,
        attendanceSummaryRes,
        attendanceRecentRes,
        violationsSummaryRes,
        scoreRes,
        healthRes,
      ] = await Promise.all([
        studentService.list({
          page: 1,
          limit: 1,
          academic_year_id: selectedAcademicYearId || undefined,
        }),
        teacherService.list({ page: 1, limit: 1 }),
        classService.list({
          page: 1,
          limit: 1,
          assigned_only: teacherOnly || undefined,
        }),
        subjectService.list({ page: 1, limit: 1 }),
        attendanceService.summary({
          date_from: toYmd(monthStart),
          date_to: toYmd(now),
        }),
        attendanceService.list({
          page: 1,
          limit: 100,
          date_from: toYmd(sevenDaysAgo),
          date_to: toYmd(now),
        }),
        violationService.summary({
          academic_year_id: selectedAcademicYearId || undefined,
        }),
        scoreService.list({
          page: 1,
          limit: 100,
          academic_year_id: selectedAcademicYearId || undefined,
        }),
        healthService.check(),
      ]);

      let activeTeacherAssignments = 0;
      let activeTeacherClasses = 0;

      if (teacherOnly && (user?.nip || user?.name)) {
        const teacherLookupRes = await teacherService.list({
          page: 1,
          limit: 1,
          search: user?.nip || user?.name || undefined,
        });

        const teacherId = teacherLookupRes.data[0]?.id;
        if (teacherId) {
          const assignmentsRes = await scheduleService.listTeachingAssignments({
            page: 1,
            limit: 100,
            teacher_id: teacherId,
            academic_year_id: selectedAcademicYearId || undefined,
            include_inactive: false,
          });

          activeTeacherAssignments = assignmentsRes.data.filter((row) => row.is_active).length;
          activeTeacherClasses = new Set(
            assignmentsRes.data.filter((row) => row.is_active).map((row) => row.class.id)
          ).size;
        }
      }

      const averageScore = scoreRes.data.length
        ? Number(
            (
              scoreRes.data.reduce((sum, row) => sum + row.nilai, 0) /
              scoreRes.data.length
            ).toFixed(2)
          )
        : null;

      setKpi({
        totalStudents: studentsRes.meta.total,
        totalTeachers: teachersRes.meta.total,
        totalClasses: classesRes.meta.total,
        totalSubjects: subjectsRes.meta.total,
        attendanceThisMonth: attendanceSummaryRes.data.total,
        violationPoints: violationsSummaryRes.data.total_points,
        averageScore,
        healthUptimeHours: Number((healthRes.data.uptime / 3600).toFixed(1)),
        activeTeacherAssignments,
        activeTeacherClasses,
      });

      setAttendanceStatusData([
        {
          key: "hadir",
          label: "Hadir",
          value: attendanceSummaryRes.data.by_status.hadir,
          fill: "var(--color-hadir)",
        },
        {
          key: "izin",
          label: "Izin",
          value: attendanceSummaryRes.data.by_status.izin,
          fill: "var(--color-izin)",
        },
        {
          key: "sakit",
          label: "Sakit",
          value: attendanceSummaryRes.data.by_status.sakit,
          fill: "var(--color-sakit)",
        },
        {
          key: "alpha",
          label: "Alpha",
          value: attendanceSummaryRes.data.by_status.alpha,
          fill: "var(--color-alpha)",
        },
      ]);

      setViolationSeverityData([
        {
          key: "minor",
          label: "Ringan",
          value: violationsSummaryRes.data.by_severity.minor,
          fill: "var(--color-minor)",
        },
        {
          key: "moderate",
          label: "Sedang",
          value: violationsSummaryRes.data.by_severity.moderate,
          fill: "var(--color-moderate)",
        },
        {
          key: "severe",
          label: "Berat",
          value: violationsSummaryRes.data.by_severity.severe,
          fill: "var(--color-severe)",
        },
      ]);

      const trendSeed = Array.from({ length: 7 }).map((_, idx) => {
        const date = new Date(sevenDaysAgo);
        date.setDate(sevenDaysAgo.getDate() + idx);
        return {
          date: toYmd(date),
          total: 0,
          hadir: 0,
        };
      });

      const trendMap = new Map(trendSeed.map((item) => [item.date, { ...item }]));
      attendanceRecentRes.data.forEach((row) => {
        const existing = trendMap.get(row.date);
        if (!existing) return;
        existing.total += 1;
        if (row.status === "hadir") {
          existing.hadir += 1;
        }
      });

      setAttendanceTrendData(
        Array.from(trendMap.values()).map((item) => ({
          ...item,
          date: toShortDateLabel(item.date),
        }))
      );
    } catch {
      setErrorMessage("Gagal memuat ringkasan dashboard. Coba muat ulang halaman.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedAcademicYearId, teacherOnly, user?.name, user?.nip]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const kpiCards = useMemo(
    () => [
      {
        title: "Total Siswa",
        value: kpi.totalStudents.toLocaleString("id-ID"),
        caption: "Data siswa terdaftar",
        icon: GraduationCap,
      },
      {
        title: "Total Guru",
        value: kpi.totalTeachers.toLocaleString("id-ID"),
        caption: "Guru aktif dan nonaktif",
        icon: Users,
      },
      {
        title: "Kelas",
        value: kpi.totalClasses.toLocaleString("id-ID"),
        caption: "Total kelas tersedia",
        icon: CalendarDays,
      },
      {
        title: "Mata Pelajaran",
        value: kpi.totalSubjects.toLocaleString("id-ID"),
        caption: "Mapel pada sistem",
        icon: BookOpen,
      },
      {
        title: "Absensi Bulan Ini",
        value: kpi.attendanceThisMonth.toLocaleString("id-ID"),
        caption: "Total catatan absensi",
        icon: ClipboardCheck,
      },
      {
        title: "Poin Pelanggaran",
        value: kpi.violationPoints.toLocaleString("id-ID"),
        caption: "Akumulasi poin",
        icon: AlertTriangle,
      },
    ],
    [kpi]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="mt-1 text-slate-600">Selamat datang kembali, {user?.name || "Pengguna"}.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{roleLabel}</Badge>
              <Badge variant="secondary">Tahun Ajaran: {selectedAcademicYearName}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button key={action.href} asChild size="sm" variant="outline">
                <Link to={action.href}>{action.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {errorMessage ? (
        <Card>
          <CardContent className="py-6 text-sm text-rose-600">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpiCards.map((item) => (
          <Card key={item.title} className="bg-white/85 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between text-slate-600">
                {item.title}
                <item.icon className="size-4" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <CardTitle className="text-2xl text-slate-900">{item.value}</CardTitle>
                  <p className="mt-1 text-xs text-slate-500">{item.caption}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-emerald-600" />
              Tren Absensi 7 Hari
            </CardTitle>
            <CardDescription>Perbandingan total catatan dan kehadiran harian.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={ATTENDANCE_TREND_CONFIG} className="h-64 w-full">
              <AreaChart data={attendanceTrendData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Area type="monotone" dataKey="total" stroke="var(--color-total)" fill="var(--color-total)" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="hadir" stroke="var(--color-hadir)" fill="var(--color-hadir)" fillOpacity={0.35} strokeWidth={2} />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-rose-600" />
              Severity Pelanggaran
            </CardTitle>
            <CardDescription>Distribusi tingkat pelanggaran siswa.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={VIOLATION_SEVERITY_CONFIG} className="h-64 w-full">
              <PieChart>
                <Pie data={violationSeverityData} dataKey="value" nameKey="label" innerRadius={46} outerRadius={84} paddingAngle={3}>
                  {violationSeverityData.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Absensi Bulan Ini</CardTitle>
            <CardDescription>Ringkasan status kehadiran.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={ATTENDANCE_STATUS_CONFIG} className="h-56 w-full">
              <BarChart data={attendanceStatusData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="value" radius={6}>
                  {attendanceStatusData.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Insight Akademik</CardTitle>
            <CardDescription>Ringkasan performa dan operasional.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span>Rata-rata Nilai</span>
              <Badge variant="secondary">
                {kpi.averageScore === null ? "Belum ada" : kpi.averageScore.toLocaleString("id-ID")}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span>Uptime Server</span>
              <Badge variant="outline" className="gap-1">
                <HeartPulse className="size-3" />
                {kpi.healthUptimeHours === null ? "-" : `${kpi.healthUptimeHours} jam`}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span>Total Poin Pelanggaran</span>
              <Badge>{kpi.violationPoints.toLocaleString("id-ID")}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ringkasan Role</CardTitle>
            <CardDescription>
              {teacherOnly
                ? "Statistik tugas mengajar Anda saat ini."
                : "Akses cepat untuk monitoring institusi."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {teacherOnly ? (
              <>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span>Penugasan Aktif</span>
                  <Badge>{kpi.activeTeacherAssignments}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span>Kelas Diampu</span>
                  <Badge variant="secondary">{kpi.activeTeacherClasses}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span>Tahun Ajaran</span>
                  <Badge variant="outline">{selectedAcademicYearName}</Badge>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span>Profil Data</span>
                  <Badge variant="secondary">{adminLike ? "Institusi" : "Ringkasan"}</Badge>
                </div>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/health">
                    <Route className="mr-2 size-4" />
                    Lihat Status Server
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/pengaturan">Kelola Pengaturan</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
