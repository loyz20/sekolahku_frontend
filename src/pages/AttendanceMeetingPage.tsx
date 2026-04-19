import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { attendanceService } from "@/services/attendanceService";
import { classService } from "@/services/classService";
import { subjectService } from "@/services/subjectService";
import { scheduleService } from "@/services/scheduleService";
import { useAuthStore } from "@/stores/authStore";
import { isAdminLike, isTeacherOnly } from "@/lib/roles";
import type {
  AttendanceItem,
  AttendanceStatus,
  ClassListItem,
  ClassStudentItem,
  SubjectListItem,
} from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const STATUS_OPTIONS: Array<{ value: AttendanceStatus; label: string }> = [
  { value: "hadir", label: "Hadir" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "alpha", label: "Alpha" },
];

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpha: "Alpha",
};

const STATUS_BUTTON_CLASS: Record<AttendanceStatus, string> = {
  hadir: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800",
  izin: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800",
  sakit: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800",
  alpha: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800",
};

type AttendanceDraft = {
  status: AttendanceStatus;
  notes: string;
};

export default function AttendanceMeetingPage() {
  const user = useAuthStore((s) => s.user);
  const canAccessAllClasses = isAdminLike(user?.duties);
  const isTeacherRoleOnly = isTeacherOnly(user?.duties);
  const selectedAcademicYearId = Number(localStorage.getItem("selectedAcademicYearId") || 0);

  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectListItem[]>([]);
  const [teacherSubjectIds, setTeacherSubjectIds] = useState<number[]>([]);
  const [students, setStudents] = useState<ClassStudentItem[]>([]);
  const [records, setRecords] = useState<AttendanceItem[]>([]);
  const [drafts, setDrafts] = useState<Record<number, AttendanceDraft>>({});

  const [selectedClassId, setSelectedClassId] = useState("-");
  const [selectedSubjectId, setSelectedSubjectId] = useState("-");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AttendanceStatus>("all");

  const [isLoadingRefs, setIsLoadingRefs] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const visibleSubjects = useMemo(() => {
    if (!isTeacherRoleOnly) return subjects;
    if (selectedClassId === "-") return [];
    return subjects.filter((subject) => teacherSubjectIds.includes(subject.id));
  }, [isTeacherRoleOnly, selectedClassId, subjects, teacherSubjectIds]);

  const canLoadRecords = selectedClassId !== "-" && selectedSubjectId !== "-" && !!selectedDate;

  const loadReferences = useCallback(async () => {
    setIsLoadingRefs(true);
    try {
      const [classRes, subjectRes] = await Promise.all([
        classService.list({
          limit: 100,
          assigned_only: !canAccessAllClasses,
        }),
        subjectService.list({ limit: 100 }),
      ]);
      setClasses(classRes.data);
      setSubjects(subjectRes.data);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat referensi absensi";
      toast.error(message);
    } finally {
      setIsLoadingRefs(false);
    }
  }, [canAccessAllClasses]);

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

  const loadRecords = useCallback(async () => {
    if (!canLoadRecords) {
      setRecords([]);
      setDrafts({});
      return;
    }

    setIsLoadingRecords(true);
    try {
      const allRecords: AttendanceItem[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const attendanceRes = await attendanceService.list({
          page: currentPage,
          limit: 100,
          subject_id: Number(selectedSubjectId),
          date_from: selectedDate,
          date_to: selectedDate,
        });

        allRecords.push(...attendanceRes.data);
        totalPages = attendanceRes.meta?.totalPages || 1;
        currentPage += 1;
      } while (currentPage <= totalPages);

      const classStudentIds = new Set(students.map((s) => s.id));
      const classRecords = allRecords.filter((row) => classStudentIds.has(row.student.id));

      const nextDrafts: Record<number, AttendanceDraft> = {};
      for (const student of students) {
        const matched = classRecords.find((row) => row.student.id === student.id);
        nextDrafts[student.id] = {
          status: matched?.status || "hadir",
          notes: matched?.notes || "",
        };
      }

      setRecords(classRecords);
      setDrafts(nextDrafts);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat data absensi";
      toast.error(message);
    } finally {
      setIsLoadingRecords(false);
    }
  }, [canLoadRecords, selectedSubjectId, selectedDate, students]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return students.filter((student) => {
      const draft = drafts[student.id];
      const status = draft?.status || "hadir";
      const byStatus = statusFilter === "all" || status === statusFilter;
      const byKeyword =
        !keyword ||
        student.name.toLowerCase().includes(keyword) ||
        student.nis.toLowerCase().includes(keyword);
      return byStatus && byKeyword;
    });
  }, [students, drafts, search, statusFilter]);

  const summary = useMemo(() => {
    const value = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
    for (const student of students) {
      const status = drafts[student.id]?.status || "hadir";
      value[status] += 1;
    }
    return value;
  }, [students, drafts]);

  function onDraftStatusChange(studentId: number, status: AttendanceStatus) {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { notes: "" }),
        status,
      },
    }));
  }

  function onDraftNotesChange(studentId: number, notes: string) {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: "hadir" }),
        notes,
      },
    }));
  }

  async function saveAttendance() {
    if (!canLoadRecords || !students.length) return;

    setIsSaving(true);
    try {
      const entries = students.map((student) => ({
        student_id: student.id,
        status: drafts[student.id]?.status || "hadir",
        notes: drafts[student.id]?.notes?.trim() || undefined,
      }));

      await attendanceService.bulkUpsert({
        subject_id: Number(selectedSubjectId),
        date: selectedDate,
        entries,
      });

      toast.success("Absensi berhasil disimpan");
      await loadRecords();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menyimpan absensi";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Absensi Siswa</h1>
            <p className="text-muted-foreground">Kelola kehadiran harian per mata pelajaran.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/absensi/laporan">Buka Laporan Absensi</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Absensi</CardTitle>
          <CardDescription>Pilih kelas, mata pelajaran, dan tanggal.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Kelas</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="-">Pilih kelas</SelectItem>
                {classes.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>{item.code} - {item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mata Pelajaran</Label>
            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
              <SelectTrigger className="w-full" disabled={isTeacherRoleOnly && selectedClassId === "-"}><SelectValue placeholder="Pilih mapel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="-">Pilih mapel</SelectItem>
                {visibleSubjects.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>{item.code} - {item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Daftar Absensi</CardTitle>
            <CardDescription>
              Ringkasan: Hadir {summary.hadir}, Izin {summary.izin}, Sakit {summary.sakit}, Alpha {summary.alpha}
            </CardDescription>
          </div>
          <Button onClick={saveAttendance} disabled={!canLoadRecords || isSaving || !students.length}>
            {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Save className="mr-2 size-4" />
            Simpan Absensi
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input placeholder="Cari siswa (nama / NIS)" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | AttendanceStatus)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="justify-center md:justify-self-end">{records.length} record tersimpan</Badge>
          </div>

          {isLoadingRefs || isLoadingStudents || isLoadingRecords ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : !canLoadRecords ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Pilih filter terlebih dahulu.</div>
          ) : !students.length ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Tidak ada siswa aktif di kelas ini.</div>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="rounded-xl border p-3">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{student.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">NIS: {student.nis}</p>
                      </div>
                      <Badge variant="outline">{STATUS_LABEL[drafts[student.id]?.status || "hadir"]}</Badge>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((option) => {
                        const isActive = (drafts[student.id]?.status || "hadir") === option.value;

                        return (
                          <Button
                            key={option.value}
                            type="button"
                            variant="outline"
                            size="sm"
                            className={`rounded-full px-3 ${STATUS_BUTTON_CLASS[option.value]} ${isActive ? "ring-2 ring-offset-2" : ""}`}
                            onClick={() => onDraftStatusChange(student.id, option.value)}
                          >
                            <span className="mr-1 inline-flex size-2 rounded-full bg-current" />
                            {option.label}
                          </Button>
                        );
                      })}
                    </div>

                    <Input
                      value={drafts[student.id]?.notes || ""}
                      onChange={(e) => onDraftNotesChange(student.id, e.target.value)}
                      placeholder={`Catatan (${STATUS_LABEL[drafts[student.id]?.status || "hadir"]})`}
                    />
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIS</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{student.nis}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="min-w-56">
                          <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map((option) => {
                              const isActive = (drafts[student.id]?.status || "hadir") === option.value;

                              return (
                                <Button
                                  key={option.value}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className={`rounded-full px-3 ${STATUS_BUTTON_CLASS[option.value]} ${isActive ? "ring-2 ring-offset-2" : ""}`}
                                  onClick={() => onDraftStatusChange(student.id, option.value)}
                                >
                                  <span className="mr-1 inline-flex size-2 rounded-full bg-current" />
                                  {option.label}
                                </Button>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={drafts[student.id]?.notes || ""}
                            onChange={(e) => onDraftNotesChange(student.id, e.target.value)}
                            placeholder={`Catatan (${STATUS_LABEL[drafts[student.id]?.status || "hadir"]})`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
