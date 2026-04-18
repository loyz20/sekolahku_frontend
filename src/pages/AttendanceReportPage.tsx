import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { CalendarRange, CheckCircle2, Loader2, Search, Sparkles, Stethoscope, Users, XCircle } from "lucide-react";
import { attendanceService } from "@/services/attendanceService";
import { academicYearService } from "@/services/academicYearService";
import { classService } from "@/services/classService";
import { subjectService } from "@/services/subjectService";
import { scheduleService } from "@/services/scheduleService";
import { useAuthStore } from "@/stores/authStore";
import { isAdminLike, isTeacherOnly } from "@/lib/roles";
import type { AcademicYear, AttendanceItem, ClassListItem, ClassStudentItem, SubjectListItem } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AttendanceReportRow = {
  studentId: number;
  nis: string;
  name: string;
  hadirCount: number;
  totalPertemuan: number;
  persentaseKehadiran: number;
};

const STATUS_LABEL: Record<AttendanceItem["status"], string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpha: "Alpha",
};

const STATUS_BADGE_CLASS: Record<AttendanceItem["status"], string> = {
  hadir: "border-emerald-200 bg-emerald-50 text-emerald-700",
  izin: "border-amber-200 bg-amber-50 text-amber-700",
  sakit: "border-sky-200 bg-sky-50 text-sky-700",
  alpha: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function AttendanceReportPage() {
  const user = useAuthStore((s) => s.user);
  const canAccessAllClasses = isAdminLike(user?.duties);
  const isTeacherRoleOnly = isTeacherOnly(user?.duties);
  const selectedAcademicYearId = Number(localStorage.getItem("selectedAcademicYearId") || 0);
  const selectedAcademicYearName = localStorage.getItem("selectedAcademicYearName") || "Belum dipilih";

  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectListItem[]>([]);
  const [teacherSubjectIds, setTeacherSubjectIds] = useState<number[]>([]);
  const [students, setStudents] = useState<ClassStudentItem[]>([]);
  const [rows, setRows] = useState<AttendanceReportRow[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYear | null>(null);
  const [detailStudent, setDetailStudent] = useState<AttendanceReportRow | null>(null);
  const [detailRecords, setDetailRecords] = useState<AttendanceItem[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [selectedClassId, setSelectedClassId] = useState("-");
  const [selectedSubjectId, setSelectedSubjectId] = useState("-");

  const [isLoadingRefs, setIsLoadingRefs] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const visibleSubjects = useMemo(() => {
    if (!isTeacherRoleOnly) return subjects;
    if (selectedClassId === "-") return [];
    return subjects.filter((subject) => teacherSubjectIds.includes(subject.id));
  }, [isTeacherRoleOnly, selectedClassId, subjects, teacherSubjectIds]);

  const canLoadReport = selectedClassId !== "-" && selectedSubjectId !== "-";

  const reportSummary = useMemo(() => {
    const totalStudents = rows.length;
    const totalPertemuan = rows.length ? rows[0].totalPertemuan : 0;
    const rataRataKehadiran = totalStudents
      ? Number((rows.reduce((sum, row) => sum + row.persentaseKehadiran, 0) / totalStudents).toFixed(2))
      : 0;

    return {
      totalStudents,
      totalPertemuan,
      rataRataKehadiran,
    };
  }, [rows]);

  const detailSummary = useMemo(() => {
    const byStatus = {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alpha: 0,
    };

    for (const record of detailRecords) {
      byStatus[record.status] += 1;
    }

    const totalPertemuan = detailRecords.length;
    const persentaseKehadiran = totalPertemuan
      ? Number(((byStatus.hadir / totalPertemuan) * 100).toFixed(2))
      : 0;

    return {
      totalPertemuan,
      byStatus,
      persentaseKehadiran,
    };
  }, [detailRecords]);

  const loadReferences = useCallback(async () => {
    setIsLoadingRefs(true);
    try {
      const [classRes, subjectRes, academicYearRes] = await Promise.all([
        classService.list({
          limit: 100,
          assigned_only: !canAccessAllClasses,
        }),
        subjectService.list({ limit: 100 }),
        academicYearService.listPublic({ limit: 100 }),
      ]);
      setClasses(classRes.data);
      setSubjects(subjectRes.data);
      const matchedAcademicYear =
        academicYearRes.data.find((year) => year.id === selectedAcademicYearId) || null;
      setSelectedAcademicYear(matchedAcademicYear);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat referensi laporan absensi";
      toast.error(message);
    } finally {
      setIsLoadingRefs(false);
    }
  }, [canAccessAllClasses, selectedAcademicYearId]);

  const loadStudents = useCallback(async () => {
    if (selectedClassId === "-") {
      setStudents([]);
      return;
    }

    setIsLoadingStudents(true);
    try {
      const classDetailRes = await classService.getById(Number(selectedClassId));
      const activeStudents = classDetailRes.data.students.filter((s) => s.enrollment.is_active);
      setStudents(activeStudents);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat siswa kelas";
      toast.error(message);
    } finally {
      setIsLoadingStudents(false);
    }
  }, [selectedClassId]);

  const loadReport = useCallback(async () => {
    if (!canLoadReport) {
      setRows([]);
      return;
    }

    if (!selectedAcademicYear) {
      setRows([]);
      toast.error("Tahun akademik belum dipilih. Pilih tahun akademik saat login terlebih dahulu.");
      return;
    }

    setIsLoadingReport(true);
    try {
      const allRecords: AttendanceItem[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const attendanceRes = await attendanceService.list({
          page: currentPage,
          limit: 100,
          subject_id: Number(selectedSubjectId),
          date_from: selectedAcademicYear.start_date,
          date_to: selectedAcademicYear.end_date,
        });

        allRecords.push(...attendanceRes.data);
        totalPages = attendanceRes.meta?.totalPages || 1;
        currentPage += 1;
      } while (currentPage <= totalPages);

      const classStudentIds = new Set(students.map((student) => student.id));
      const classRecords = allRecords.filter((record) => classStudentIds.has(record.student.id));
      const totalPertemuan = new Set(classRecords.map((record) => record.date)).size;

      const hadirByStudent = new Map<number, number>();
      for (const record of classRecords) {
        if (record.status !== "hadir") continue;
        hadirByStudent.set(record.student.id, (hadirByStudent.get(record.student.id) || 0) + 1);
      }

      const nextRows: AttendanceReportRow[] = students.map((student) => {
        const hadirCount = hadirByStudent.get(student.id) || 0;
        const persentaseKehadiran = totalPertemuan
          ? Number(((hadirCount / totalPertemuan) * 100).toFixed(2))
          : 0;

        return {
          studentId: student.id,
          nis: student.nis,
          name: student.name,
          hadirCount,
          totalPertemuan,
          persentaseKehadiran,
        };
      });

      setRows(nextRows);
    } catch (err) {
      setRows([]);
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat laporan persentase kehadiran";
      toast.error(message);
    } finally {
      setIsLoadingReport(false);
    }
  }, [canLoadReport, selectedSubjectId, selectedAcademicYear, students]);

  useEffect(() => {
    void loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (!isTeacherRoleOnly) {
      setTeacherSubjectIds([]);
      return;
    }

    if (selectedClassId === "-" || !selectedAcademicYearId) {
      setTeacherSubjectIds([]);
      return;
    }

    let cancelled = false;

    const loadTeacherSubjects = async () => {
      try {
        const classScheduleRes = await scheduleService.getClassSchedule(
          Number(selectedClassId),
          selectedAcademicYearId
        );

        const subjectIds = Array.from(
          new Set(
            classScheduleRes.data.slots
              .filter((slot) => {
                if (!slot.subject || !slot.teacher) {
                  return false;
                }
                if (user?.nip) {
                  return slot.teacher.nip === user.nip;
                }
                if (user?.name) {
                  return slot.teacher.name === user.name;
                }
                return false;
              })
              .map((slot) => slot.subject!.id)
          )
        );

        if (!cancelled) {
          setTeacherSubjectIds(subjectIds);
        }
      } catch (err) {
        if (!cancelled) {
          setTeacherSubjectIds([]);
        }
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Gagal memuat mata pelajaran guru";
        toast.error(message);
      }
    };

    void loadTeacherSubjects();

    return () => {
      cancelled = true;
    };
  }, [isTeacherRoleOnly, selectedClassId, selectedAcademicYearId, user?.name, user?.nip]);

  useEffect(() => {
    if (selectedSubjectId === "-") return;

    const isSelectedSubjectVisible = visibleSubjects.some(
      (subject) => String(subject.id) === selectedSubjectId
    );

    if (!isSelectedSubjectVisible) {
      setSelectedSubjectId("-");
    }
  }, [selectedSubjectId, visibleSubjects]);

  async function openDetail(row: AttendanceReportRow) {
    if (!selectedAcademicYear) {
      toast.error("Tahun akademik belum dipilih. Pilih tahun akademik saat login terlebih dahulu.");
      return;
    }

    setDetailStudent(row);
    setDetailRecords([]);
    setIsDetailOpen(true);
    setIsLoadingDetail(true);

    try {
      const allRecords: AttendanceItem[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const attendanceRes = await attendanceService.list({
          page: currentPage,
          limit: 100,
          student_id: row.studentId,
          subject_id: Number(selectedSubjectId),
          date_from: selectedAcademicYear.start_date,
          date_to: selectedAcademicYear.end_date,
        });

        allRecords.push(...attendanceRes.data);
        totalPages = attendanceRes.meta?.totalPages || 1;
        currentPage += 1;
      } while (currentPage <= totalPages);

      setDetailRecords(allRecords);
    } catch (err) {
      setDetailRecords([]);
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat detail absensi siswa";
      toast.error(message);
    } finally {
      setIsLoadingDetail(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-sky-100 bg-gradient-to-r from-sky-50 via-cyan-50 to-emerald-50">
        <CardContent className="py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold text-sky-700">
                <Sparkles className="h-3.5 w-3.5" />
                Laporan Kehadiran Akademik
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Laporan Absensi</h1>
              <p className="text-sm text-slate-600">
                Persentase Kehadiran = (Jumlah Hadir / Total Pertemuan) x 100%
              </p>
            </div>

            <div className="rounded-xl border border-sky-200/70 bg-white/85 px-4 py-3 text-sm text-slate-700 shadow-sm">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-700">
                <CalendarRange className="h-3.5 w-3.5" />
                Tahun Akademik Aktif
              </p>
              <p className="mt-1 font-semibold text-slate-900">{selectedAcademicYearName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
          <CardDescription>Pilih kelas dan mata pelajaran. Tanggal mengikuti tahun akademik yang dipilih saat login.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Kelas</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-">Pilih kelas</SelectItem>
                {classes.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.code} - {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mata Pelajaran</Label>
            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
              <SelectTrigger disabled={isTeacherRoleOnly && selectedClassId === "-"}>
                <SelectValue placeholder="Pilih mapel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-">Pilih mapel</SelectItem>
                {visibleSubjects.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.code} - {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Hasil Laporan</CardTitle>
            <CardDescription>
              Menampilkan total hadir, total pertemuan, dan persentase kehadiran per siswa.
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              void loadReport();
            }}
            disabled={!canLoadReport || isLoadingStudents || isLoadingReport}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {isLoadingReport ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
            Tampilkan Laporan
          </Button>
        </CardHeader>
        <CardContent>
          {!!rows.length && (
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Total Siswa</p>
                <p className="mt-1 inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Users className="h-4 w-4 text-slate-600" />
                  {reportSummary.totalStudents}
                </p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                <p className="text-xs text-sky-700">Total Pertemuan</p>
                <p className="mt-1 inline-flex items-center gap-2 text-lg font-semibold text-sky-800">
                  <CalendarRange className="h-4 w-4" />
                  {reportSummary.totalPertemuan}
                </p>
              </div>
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
                <p className="text-xs text-violet-700">Rata-rata Kehadiran</p>
                <p className="mt-1 text-lg font-semibold text-violet-800">{reportSummary.rataRataKehadiran.toFixed(2)}%</p>
              </div>
            </div>
          )}

          {isLoadingRefs || isLoadingStudents ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : !canLoadReport ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Pilih kelas dan mata pelajaran terlebih dahulu.</div>
          ) : !students.length ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Tidak ada siswa aktif di kelas ini.</div>
          ) : !rows.length ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Klik "Tampilkan Laporan" untuk memuat data.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="text-right">Jumlah Hadir</TableHead>
                    <TableHead className="text-right">Total Pertemuan</TableHead>
                    <TableHead className="text-right">Persentase Kehadiran</TableHead>
                    <TableHead className="text-right">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.studentId} className="hover:bg-slate-50/80">
                      <TableCell className="font-mono text-xs text-muted-foreground">{row.nis}</TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-right">{row.hadirCount}</TableCell>
                      <TableCell className="text-right">{row.totalPertemuan}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-50">
                          {row.persentaseKehadiran.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => void openDetail(row)}>
                          Lihat Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Detail Absensi: {detailStudent?.name || "-"}
            </DialogTitle>
            <DialogDescription>
              NIS: {detailStudent?.nis || "-"} | Tahun Akademik: {selectedAcademicYearName}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Pertemuan</p>
                  <p className="text-lg font-semibold">{detailSummary.totalPertemuan}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Hadir</p>
                  <p className="inline-flex items-center gap-1 text-lg font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {detailSummary.byStatus.hadir}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Izin</p>
                  <p className="text-lg font-semibold text-amber-700">{detailSummary.byStatus.izin}</p>
                </div>
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Sakit</p>
                  <p className="inline-flex items-center gap-1 text-lg font-semibold text-sky-700">
                    <Stethoscope className="h-4 w-4" />
                    {detailSummary.byStatus.sakit}
                  </p>
                </div>
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Persentase</p>
                  <p className="text-lg font-semibold">{detailSummary.persentaseKehadiran.toFixed(2)}%</p>
                </div>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <p className="inline-flex items-center gap-1 font-medium">
                  <XCircle className="h-4 w-4" />
                  Alpha: {detailSummary.byStatus.alpha} pertemuan
                </p>
              </div>

              {!detailRecords.length ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Belum ada data absensi untuk siswa ini pada tahun akademik terpilih.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80">
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailRecords.map((record) => (
                        <TableRow key={record.id} className="hover:bg-slate-50/80">
                          <TableCell>
                            {new Date(record.date).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge className={`border ${STATUS_BADGE_CLASS[record.status]} hover:opacity-100`}>
                              {STATUS_LABEL[record.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
